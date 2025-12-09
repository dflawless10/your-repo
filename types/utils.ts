// types/utils.ts
export type IsString<T> = T extends string ? true : false;

export type OnlyStringKeys<T> = {
  [K in keyof T]: IsString<T[K]> extends true ? K : never;
}[keyof T];

export type OnlyStringFields<T> = Pick<T, OnlyStringKeys<T>>;

export type FormFields<T> = {
  [K in keyof T]: T[K] extends string
    ? { type: 'text'; label: K }
    : T[K] extends number
      ? { type: 'number'; label: K }
      : never;
};
