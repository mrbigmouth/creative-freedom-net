/* eslint no-console: "off" */
function check(value, pattern) {
  const result = testSubtree(value, pattern);
  if (result) {
    const err = new TypeError(result.message);
    if (result.path) {
      err.message += ` in field ${result.path}`;
      err.path = result.path;
    }
    console.error(err);
    throw err;
  }

  return undefined;
}
exports.check = check;

class Match {
  constructor(condition) {
    this.condition = condition;

    return this;
  }
}
class Optional {
  constructor(pattern) {
    this.pattern = pattern;

    return this;
  }
}
class Maybe {
  constructor(pattern) {
    this.pattern = pattern;

    return this;
  }
}
class OneOf {
  constructor(...choices) {
    if (choices.length < 1) {
      throw new Error('Must provide at least one choice to OneOf');
    }
    this.choices = choices;

    return this;
  }
}
class ObjectIncluding {
  constructor(pattern) {
    this.pattern = pattern;

    return this;
  }
}
class ObjectWithValues {
  constructor(pattern) {
    this.pattern = pattern;

    return this;
  }
}

const anyPattern = ['__any__'];
const integerPattern = ['__integer__'];
const patterns = {
  any: anyPattern,
  int: integerPattern,
  integer: integerPattern,
  notEmptyString: new Match((value) => {
    check(value, String);

    return (value.length > 0);
  }),
  match(condition) {
    return new Match(condition);
  },
  optional(pattern) {
    return new Optional(pattern);
  },
  maybe(pattern) {
    return new Maybe(pattern);
  },
  oneOf(...args) {
    return new OneOf(...args);
  },
  objectIncluding(pattern) {
    return new ObjectIncluding(pattern);
  },
  objectWithValues(pattern) {
    return new ObjectWithValues(pattern);
  },
};
exports.patterns = patterns;

function testSubtree(value, pattern) {
  // Match anything!
  if (pattern === anyPattern) {
    return false;
  }

  let result;
  let patternForCheck = pattern;

  // if pattern is basic type contrsuctor, check value typeof.
  result = basicTypeofCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }
  // if pattern is null, check value equal null.
  result = nullCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }
  // if pattern is Strings, numbers, and booleans. check value equal pattern.
  result = literallyCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }
  // if pattern is Integer.
  result = integerCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }

  // "Object" is shorthand for ObjectIncluding({});
  if (patternForCheck === Object) {
    patternForCheck = new ObjectIncluding({});
  }

  // if pattern is array.
  result = arrayCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }

  // if pattern is match patterns.
  result = matchCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }

  // shorthand for Maybe and Optional
  if (patternForCheck instanceof Maybe) {
    patternForCheck = new OneOf(patternForCheck.pattern, undefined, null);
  }
  else if (patternForCheck instanceof Optional) {
    patternForCheck = new OneOf(patternForCheck.pattern, undefined);
  }

  // if pattern is OneOf
  result = oneOfCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }

  // if pattern is constructor
  result = constructorCheck(value, patternForCheck);
  if (result !== undefined) {
    return result;
  }

  // if pattern is object or ObjectIncluding/ObjectWithValues patterns
  return objectCheck(value, patternForCheck);
}

// if pattern is basic type contrsuctor, check value typeof.
const typeOfCheckHash = {
  string: String,
  number: Number,
  boolean: Boolean,
  function: Function,
  undefined,
};
const typeOfCheckList = Object.values(typeOfCheckHash);
function basicTypeofCheck(value, pattern) {
  if (typeOfCheckList.includes(pattern)) {
    const type = (typeof value);
    const expectedType = typeOfCheckHash[type];

    if (expectedType === pattern) {
      return false;
    }

    const message = stringForErrorMessage(value, {
      onlyShowType: true,
    });

    return {
      message: `Expected ${expectedType} , got ${message}`,
      path: '',
    };
  }

  return undefined;
}

// if pattern is null, check value equal null.
function nullCheck(value, pattern) {
  if (pattern === null) {
    if (value === null) {
      return false;
    }

    return {
      message: `Expected null, got ${stringForErrorMessage(value)}`,
      path: '',
    };
  }

  return undefined;
}

// if pattern is Strings, numbers, and booleans. check value equal value.
const literallyTypeList = ['string', 'number', 'boolean'];
function literallyCheck(value, pattern) {
  const patternType = typeof pattern;
  if (literallyTypeList.includes(patternType)) {
    if (value === pattern) {
      return false;
    }

    return {
      message: `Expected ${pattern}, got ${stringForErrorMessage(value)}`,
      path: '',
    };
  }

  return undefined;
}

// if pattern is Integer.
const isInteger = Number.isSafeInteger;
function integerCheck(value, pattern) {
  if (pattern === integerPattern) {
    if (isInteger(value)) {
      return false;
    }

    return {
      message: `Expected Integer, got ${stringForErrorMessage(value)}`,
      path: '',
    };
  }

  return undefined;
}

// if pattern is array.
function arrayCheck(value, pattern) {
  if (pattern instanceof Array) {
    if (pattern.length !== 1) {
      return {
        message: `Bad pattern: arrays must have one type element ${stringForErrorMessage(pattern)}`,
        path: '',
      };
    }

    if (!Array.isArray(value)) {
      return {
        message: `Expected array, got ${stringForErrorMessage(value)}`,
        path: '',
      };
    }

    for (let i = 0, { length } = value; i < length; i += 1) {
      const result = testSubtree(value[i], pattern[0]);

      if (result) {
        result.path = prependPath(i, result.path);

        return result;
      }
    }

    return false;
  }

  return undefined;
}

// if pattern is match patterns.
function matchCheck(value, pattern) {
  if (pattern instanceof Match) {
    let result;
    try {
      result = pattern.condition(value);
    }
    catch (err) {
      return {
        message: err.message,
        path: err.path,
      };
    }

    if (result) {
      return false;
    }

    return {
      message: 'Failed Match validation',
      path: '',
    };
  }

  return undefined;
}

// if pattern is OneOf
function oneOfCheck(value, pattern) {
  if (pattern instanceof OneOf) {
    for (let i = 0, { length } = pattern.choices; i < length; i += 1) {
      const result = testSubtree(value, pattern.choices[i]);
      if (!result) {
        // No error? Yay, return.
        return false;
      }
      // Match errors just mean try another choice.
    }

    // XXX this error is terrible
    return {
      message: 'Failed OneOf, Maybe or Optional validation',
      path: '',
    };
  }

  return undefined;
}

// if pattern is constructor
function constructorCheck(value, pattern) {
  if (pattern instanceof Function) {
    if (value instanceof pattern) {
      return false;
    }
    const expectedString = pattern.name || 'particular constructor';

    return {
      message: `Expected ${expectedString}`,
      path: '',
    };
  }

  return undefined;
}

function objectCheck(value, pattern) {
  let unknownKeysAllowed = false;
  let unknownKeyPattern;
  let patternForCheck = pattern;
  if (patternForCheck instanceof ObjectIncluding) {
    unknownKeysAllowed = true;
    patternForCheck = patternForCheck.pattern;
  }
  if (patternForCheck instanceof ObjectWithValues) {
    unknownKeysAllowed = true;
    unknownKeyPattern = [patternForCheck.pattern];
    patternForCheck = {}; // no required keys
  }

  if (typeof patternForCheck !== 'object') {
    return {
      message: 'Bad pattern: unknown pattern type',
      path: '',
    };
  }

  // An object, with required and optional keys. Note that this does NOT do
  // structural matches against objects of special types that happen to match
  // the pattern: this really needs to be a plain old {Object}!
  if (typeof value !== 'object') {
    const type = (typeof value);

    return {
      message: `Expected object, got ${type}`,
      path: '',
    };
  }
  if (value === null) {
    return {
      message: 'Expected object, got null',
      path: '',
    };
  }
  if (!isPlainObject(value)) {
    return {
      message: 'Expected plain object',
      path: '',
    };
  }

  const requiredPatterns = {};
  const optionalPatterns = {};
  Object.keys(patternForCheck).forEach((key) => {
    const subPattern = patternForCheck[key];
    if (subPattern instanceof Optional || subPattern instanceof Maybe) {
      optionalPatterns[key] = subPattern;
    }
    else {
      requiredPatterns[key] = subPattern;
    }
  });

  /* eslint-disable guard-for-in */
  /* eslint-disable no-restricted-syntax */
  for (const key in value) {
    const subValue = value[key];
    if (Object.prototype.hasOwnProperty.call(requiredPatterns, key)) {
      const result = testSubtree(subValue, requiredPatterns[key]);
      if (result) {
        result.path = prependPath(key, result.path);

        return result;
      }

      delete requiredPatterns[key];
    }
    else if (Object.prototype.hasOwnProperty.call(optionalPatterns, key)) {
      const result = testSubtree(subValue, optionalPatterns[key]);
      if (result) {
        result.path = prependPath(key, result.path);

        return result;
      }
    }
    else {
      if (!unknownKeysAllowed) {
        return {
          message: 'Unknown key',
          path: key,
        };
      }
      if (unknownKeyPattern) {
        const result = testSubtree(subValue, unknownKeyPattern[0]);
        if (result) {
          result.path = prependPath(key, result.path);

          return result;
        }
      }
    }
  }

  const keys = Object.keys(requiredPatterns);
  if (keys.length) {
    return {
      message: `Missing key "${keys.join('", "')}"`,
      path: '',
    };
  }

  return undefined;
}

/* eslint-disable no-prototype-builtins */
function isPlainObject(obj) {
  return (
    (typeof obj === 'object') &&
    (obj.constructor === Object.hasOwnProperty(obj.constructor.prototype, 'isPrototypeOf') === false)
  );
}

// convert input value to text for error message
function stringForErrorMessage(value, options = {}) {
  if (value === null) {
    return 'null';
  }

  if (options.onlyShowType) {
    return typeof value;
  }
  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  try {
    JSON.stringify(value);
  }
  catch (stringifyError) {
    if (stringifyError.name === 'TypeError') {
      return typeof value;
    }
  }

  return JSON.stringify(value);
}

const jsKeywordList = [
  'do',
  'if',
  'in',
  'for',
  'let',
  'new',
  'try',
  'var',
  'case',
  'else',
  'enum',
  'eval',
  'false',
  'null',
  'this',
  'true',
  'void',
  'with',
  'break',
  'catch',
  'class',
  'const',
  'super',
  'throw',
  'while',
  'yield',
  'delete',
  'export',
  'import',
  'public',
  'return',
  'static',
  'switch',
  'typeof',
  'default',
  'extends',
  'finally',
  'package',
  'private',
  'continue',
  'debugger',
  'function',
  'arguments',
  'interface',
  'protected',
  'implements',
  'instanceof',
];
// Assumes the base of path is already escaped properly
// returns key + base
function prependPath(key, base) {
  let useKey = key;
  if ((typeof useKey) === 'number' || useKey.match(/^[0-9]+$/)) {
    useKey = `[${useKey}]`;
  }
  else if (!useKey.match(/^[a-z_$][0-9a-z_$]*$/i) || jsKeywordList.includes(useKey)) {
    useKey = JSON.stringify([useKey]);
  }

  if (base && base[0] !== '[') {
    return `${useKey}.${base}`;
  }

  return useKey + base;
}
