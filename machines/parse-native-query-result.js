module.exports = {


  friendlyName: 'Parse native query result',


  description: 'Parse a raw result from a native query and normalize it for the specified query type.',


  cacheable: true,


  sync: true,


  inputs: {

    queryType: {
      description: 'The type of query operation this raw result came from.',
      extendedDescription: 'Either "select", "insert", "delete", or "update". This ' +
        'determines how the provided raw result will be parsed/coerced.',
      moreInfoUrl: 'https://github.com/particlebanana/waterline-query-builder/blob/master/docs/syntax.md',
      required: true,
      example: 'select'
    },

    nativeQueryResult: {
      description: 'The result data sent back from the the database as a result of a native query.',
      extendedDescription: 'The provided data will be coerced to a JSON-serializable value if it isn\'t one ' +
        'already (see [rttc.dehydrate()](https://github.com/node-machine/rttc#dehydratevalue-allownullfalse-dontstringifyfunctionsfalse)). ' +
        'That means any Date instances therein will be converted to timezone-agnostic ISO timestamp strings (i.e. JSON timestamps).',
      required: true,
      example: '==='
    },

    meta: {
      friendlyName: 'Meta (custom)',
      description: 'Additional stuff to pass to the driver.',
      extendedDescription: 'This is reserved for custom driver-specific extensions. Please refer to the ' +
        'documentation for the driver you are using for more specific information.',
      example: '==='
    }

  },


  exits: {

    success: {
      description: 'The result was successfully normalized.',
      outputVariableName: 'report',
      outputDescription: 'The `result` property is the normalized version of the raw result originally provided.  The `meta` ' +
        'property is reserved for custom driver-specific extensions.',
      example: {
        result: '*',
        meta: '==='
      }
    }

  },


  fn: function parseNativeQueryResult(inputs, exits) {
    var _ = require('lodash');
    var normalizedResult;

    switch (inputs.queryType) {
      case 'select':
        normalizedResult = inputs.nativeQueryResult.rows;
        break;

      case 'insert':
        // Return either an integer or an array of primary keys. It's assumed
        // that insert queries will be run with something like `returning "id"`
        // attached at the end. If results is empty just return an empty array.
        // If each record contains more than one key, just include the first key.
        var insertValues;

        if (!inputs.nativeQueryResult.rows.length) {
          insertValues = [];
        } else {
          insertValues = _.map(inputs.nativeQueryResult.rows, function getValue(row) {
            return _.first(_.values(row));
          });
        }

        // If only one item was inserted return the id of that one item
        if (insertValues.length === 1) {
          insertValues = _.first(insertValues);
        }

        normalizedResult = {
          inserted: insertValues
        };
        break;

      case 'update':
        normalizedResult = {
          numRecordsUpdated: inputs.nativeQueryResult.rowCount
        };
        break;

      case 'delete':
        normalizedResult = {
          numRecordsDeleted: inputs.nativeQueryResult.rowCount
        };
        break;

      case 'average':
        var avg = _.first(inputs.nativeQueryResult.rows).avg;
        normalizedResult = {
          avg: Number(avg)
        };
        break;

      case 'max':
        var max = _.first(inputs.nativeQueryResult.rows).max;
        normalizedResult = {
          max: Number(max)
        };
        break;

      case 'min':
        var min = _.first(inputs.nativeQueryResult.rows).min;
        normalizedResult = {
          min: Number(min)
        };
        break;

      case 'sum':
        var sum = _.first(inputs.nativeQueryResult.rows).sum;
        normalizedResult = {
          sum: Number(sum)
        };
        break;

      default:

    }

    return exits.success({
      result: normalizedResult,
      meta: inputs.meta
    });
  }


};
