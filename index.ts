import {
  Booleans,
  Call,
  Pipe,
  Strings,
  Numbers,
  PartialApply,
  Compose,
  ComposeLeft,
  Match,
  Tuples,
  Objects
} from 'hotscript';
import Equals = Booleans.Equals;
import { _, Fn, unset } from 'hotscript/dist/internals/core/Core';
import Filter = Tuples.Filter;

const machine = `  
---
title: Simple sample
---
stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
` as const;

type ProtocolToken = 'stateDiagram-v2';

type Trim = Strings.Trim<'\n' | ' '>;

type Flow<fns extends Fn[]> = ComposeLeft<fns>; // more like fp-ts

type StripMeta = Flow<[Trim, Strings.TrimLeft<`---${string}---\n`>, Strings.TrimLeft<`${ProtocolToken}\n`>]>;

type FilterEmptyLines = Flow<[Strings.Split<'\n'>, Tuples.Filter<Flow<[Strings.Trim, Booleans.NotEqual<''>]>>, Tuples.Join<'\n'>]>;

type StripTabulation = Flow<[Strings.Split<'\n'>, Tuples.Map<Trim>, Tuples.Join<'\n'>]>;

type InOutToken = `[*]`;

type IsMetaStripped = Pipe<typeof machine, [StripTabulation, FilterEmptyLines, StripMeta, Equals<`[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]`>]>;

// noinspection JSUnusedLocalSymbols
const a: IsMetaStripped = true;

interface ParseLink extends Fn {
  return: this['arg0'] extends `${infer from} --> ${infer to}` ? [from, to] : never;
}

type O = Pipe<['a --> b', 'a --> c'], [Tuples.Map<ParseLink>, Tuples.GroupBy<Tuples.Head>, Objects.MapValues<Tuples.FlatMap<Tuples.Tail>>]>;

// noinspection JSUnusedLocalSymbols
const o: O = {
  a: ['b', 'c']
};

type SimpleMachine = Pipe<typeof machine, [StripTabulation, FilterEmptyLines, StripMeta, Strings.Split<'\n'>, Tuples.Map<ParseLink>, Tuples.GroupBy<Tuples.Head>, Objects.MapValues<Tuples.FlatMap<Tuples.Tail>>]>;

// noinspection JSUnusedLocalSymbols
const s: SimpleMachine = {
  '[*]': ['Still'],
  'Still': ['[*]', 'Moving'],
  'Moving': ['Still', 'Crash'],
  'Crash': ['[*]']
}

type AdjacencyList<StateId extends string> = {
  [k in StateId]: StateId[];
};

type Machine2Raw = `
---
title: Nested sample
---
stateDiagram-v2
    [*] --> First

    state First {
        [*] --> Second
    }
`;

interface ReduceStep extends Fn {
  return: this['arg0'] extends infer Acc extends {adjacency: AdjacencyList<infer StateId>, subs: infer Subs} ? this['arg1'] extends infer E extends `${infer SFrom extends StateId} --> ${infer STo extends StateId}` ? {
    adjacency: Acc['adjacency'] & {
      [k in SFrom]: [...Acc['adjacency'][STo], SFrom];
    }
  } : never : never;
}

// let's take a shot with parser combinators later https://github.com/gvergnaud/hotscript/pull/79
type Machine2 = Pipe<Machine2Raw, [
  StripTabulation,
  FilterEmptyLines,
  StripMeta,
  Strings.Split<'\n'>,
  Tuples.Reduce<ReduceStep, {
    adjacency: {},
    subs: {}
  }>
]>;

// @ts-expect-error
const m2: Machine2 = {
  adjacency: {
    '[*]': ['First'],
  },
  subs: {
    First: {
      adjacency: {
        '[*]': ['Second'],
      },
      subs: {}
    }
  }
}
