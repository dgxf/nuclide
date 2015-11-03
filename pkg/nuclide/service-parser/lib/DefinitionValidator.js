'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {locationToString} from './builtin-types';

import type {
  Definitions,
  AliasDefinition,
  InterfaceDefinition,
  Type,
} from './types';

/**
 * Throws if a named type referenced in an RPC interface is not defined.
 * The error message thrown is suitable for display to a human.
 */
export function validateDefinitions(definitions: Definitions): void {
  const namedTypes: Map<string, AliasDefinition | InterfaceDefinition> = new Map();
  gatherKnownTypes();
  validate();

  function validate(): void {
    for (const definition of definitions.values()) {
      switch (definition.kind) {
        case 'function':
          validateType(definition.type);
          break;
        case 'alias':
          if (definition.definition != null) {
            validateType(definition.definition);
          }
          break;
        case 'interface':
          // $FlowFixMe as above
          definition.constructorArgs.forEach(validateType);
            // $FlowFixMe as above
          definition.instanceMethods.forEach(validateType);
            // $FlowFixMe as above
          definition.staticMethods.forEach(validateType);
          break;
      }
    }
  }

  function gatherKnownTypes(): void {
    for (const definition of definitions.values()) {
      switch (definition.kind) {
        case 'alias':
        case 'interface':
          namedTypes.set(definition.name, definition);
          break;
      }
    }
  }

  function validateType(type: Type): void {
    switch (type.kind) {
      case 'any':
      case 'mixed':
      case 'string':
      case 'boolean':
      case 'number':
      case 'void':
        break;
      case 'promise':
        validateType(type.type);
        break;
      case 'observable':
        validateType(type.type);
        break;
      case 'array':
        validateType(type.type);
        break;
      case 'set':
        validateType(type.type);
        break;
      case 'nullable':
        validateType(type.type);
        break;
      case 'map':
        validateType(type.keyType);
        validateType(type.valueType);
        break;
      case 'object':
        type.fields.map(field => field.type).forEach(validateType);
        break;
      case 'tuple':
        type.types.forEach(validateType);
        break;
      case 'function':
        type.argumentTypes.forEach(validateType);
        validateType(type.returnType);
        break;
      case 'named':
        const name = type.name;
        if (!namedTypes.has(name)) {
          throw new Error(
            `${locationToString(type.location)}: No definition for type ${name}.`);
        }
        break;
      default:
        throw new Error(JSON.stringify(type));
    }
  }
}
