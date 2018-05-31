import {
    observable,
    computed,
    action,
    autorun,
    isObservable,
    extendObservable,
    isObservableArray,
    isObservableObject,
    toJS,
} from 'mobx';
import {
    isArray,
    map,
    filter,
    find,
    sortBy,
    forIn,
    omit,
    isPlainObject,
    result,
    uniqBy,
    each,
    mapValues,
    get,
    uniqueId,
    uniq,
    mapKeys,
} from 'lodash';
import axios from 'axios';
import moment from 'moment';

function invariant(condition) {
    var message =
        arguments.length > 1 && arguments[1] !== undefined
            ? arguments[1]
            : 'Illegal state';

    if (!condition) {
        throw new Error('[mobx-spine] ' + message);
    }
}

// lodash's `snakeCase` method removes dots from the string; this breaks mobx-spine
function camelToSnake(s) {
    return s.replace(/([A-Z])/g, function($1) {
        return '_' + $1.toLowerCase();
    });
}

// lodash's `camelCase` method removes dots from the string; this breaks mobx-spine
function snakeToCamel(s) {
    if (s.startsWith('_')) {
        return s;
    }
    return s.replace(/_\w/g, function(m) {
        return m[1].toUpperCase();
    });
}

var classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function');
    }
};

var createClass = (function() {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ('value' in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
    };
})();

var defineProperty = function(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true,
        });
    } else {
        obj[key] = value;
    }

    return obj;
};

var _extends =
    Object.assign ||
    function(target) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];

            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

        return target;
    };

var _class,
    _descriptor,
    _descriptor2,
    _descriptor3,
    _descriptor4,
    _class2,
    _temp;

function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer
            ? descriptor.initializer.call(context)
            : void 0,
    });
}

function _applyDecoratedDescriptor(
    target,
    property,
    decorators,
    descriptor,
    context
) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function(key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators
        .slice()
        .reverse()
        .reduce(function(desc, decorator) {
            return decorator(target, property, desc) || desc;
        }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

var AVAILABLE_CONST_OPTIONS = [
    'relations',
    'limit',
    'comparator',
    'repository',
];

var Store = ((_class = ((_temp = _class2 = (function() {
    createClass(Store, [
        {
            key: 'url',

            // Holds the fetch parameters
            value: function url() {
                // Try to auto-generate the URL.
                var bname = this.constructor.backendResourceName;
                if (bname) {
                    return '/' + bname + '/';
                }
                return null;
            },
        },
        {
            key: 'initialize',

            // Empty function, but can be overridden if you want to do something after initializing the model.
            value: function initialize() {},
        },
        {
            key: 'isLoading',
            get: function get$$1() {
                return this.__pendingRequestCount > 0;
            },
        },
        {
            key: 'length',
            get: function get$$1() {
                return this.models.length;
            },
        },
        {
            key: 'backendResourceName',
            set: function set$$1(v) {
                invariant(
                    false,
                    '`backendResourceName` should be a static property on the store.'
                );
            },
        },
    ]);

    function Store() {
        var options =
            arguments.length > 0 && arguments[0] !== undefined
                ? arguments[0]
                : {};
        classCallCheck(this, Store);

        _initDefineProp(this, 'models', _descriptor, this);

        _initDefineProp(this, 'params', _descriptor2, this);

        _initDefineProp(this, '__pendingRequestCount', _descriptor3, this);

        _initDefineProp(this, '__state', _descriptor4, this);

        this.__activeRelations = [];
        this.Model = null;
        this.api = null;

        invariant(
            isPlainObject(options),
            'Store only accepts an object with options. Chain `.parse(data)` to add models.'
        );
        forIn(options, function(value, option) {
            invariant(
                AVAILABLE_CONST_OPTIONS.includes(option),
                'Unknown option passed to store: ' + option
            );
        });
        this.__repository = options.repository;
        if (options.relations) {
            this.__parseRelations(options.relations);
        }
        if (options.limit !== undefined) {
            this.setLimit(options.limit);
        }
        if (options.comparator) {
            this.comparator = options.comparator;
        }
        this.initialize();
    }

    createClass(Store, [
        {
            key: '__parseRelations',
            value: function __parseRelations(activeRelations) {
                this.__activeRelations = activeRelations;
            },
        },
        {
            key: '__getApi',
            value: function __getApi() {
                invariant(
                    this.api,
                    'You are trying to perform a API request without an `api` property defined on the store.'
                );
                invariant(
                    result(this, 'url'),
                    'You are trying to perform a API request without an `url` property defined on the store.'
                );
                return this.api;
            },
        },
        {
            key: 'fromBackend',
            value: function fromBackend(_ref) {
                var _this = this;

                var data = _ref.data,
                    repos = _ref.repos,
                    relMapping = _ref.relMapping;

                invariant(
                    data,
                    'Backend error. Data is not set. HINT: DID YOU FORGET THE M2M again?'
                );

                this.models.replace(
                    data.map(function(record) {
                        // TODO: I'm not happy at all about how this looks.
                        // We'll need to finetune some things, but hey, for now it works.
                        var model = _this._newModel();
                        model.fromBackend({
                            data: record,
                            repos: repos,
                            relMapping: relMapping,
                        });
                        return model;
                    })
                );
                this.sort();
            },
        },
        {
            key: '_newModel',
            value: function _newModel() {
                var model =
                    arguments.length > 0 && arguments[0] !== undefined
                        ? arguments[0]
                        : null;

                return new this.Model(model, {
                    store: this,
                    relations: this.__activeRelations,
                });
            },
        },
        {
            key: 'sort',
            value: function sort() {
                var options =
                    arguments.length > 0 && arguments[0] !== undefined
                        ? arguments[0]
                        : {};

                invariant(
                    isPlainObject(options),
                    'Expecting a plain object for options.'
                );
                if (!this.comparator) {
                    return this;
                }
                if (typeof this.comparator === 'string') {
                    this.models.replace(this.sortBy(this.comparator));
                } else {
                    this.models.replace(this.models.sort(this.comparator));
                }
                return this;
            },
        },
        {
            key: 'parse',
            value: function parse(models) {
                invariant(
                    isArray(models),
                    'Parameter supplied to `parse()` is not an array, got: ' +
                        JSON.stringify(models)
                );
                this.models.replace(models.map(this._newModel.bind(this)));
                this.sort();

                return this;
            },
        },
        {
            key: 'parseValidationErrors',
            value: function parseValidationErrors(valErrors) {
                this.each(function(model) {
                    model.parseValidationErrors(valErrors);
                });
            },
        },
        {
            key: 'clearValidationErrors',
            value: function clearValidationErrors() {
                this.each(function(model) {
                    model.clearValidationErrors();
                });
            },
        },
        {
            key: 'add',
            value: function add(models) {
                var _this2 = this;

                var singular = !isArray(models);
                models = singular ? [models] : models.slice();

                var modelInstances = models.map(this._newModel.bind(this));

                modelInstances.forEach(function(modelInstance) {
                    var primaryValue = modelInstance[_this2.Model.primaryKey];
                    invariant(
                        !primaryValue || !_this2.get(primaryValue),
                        'A model with the same primary key value "' +
                            primaryValue +
                            '" already exists in this store.'
                    );
                    _this2.models.push(modelInstance);
                });
                this.sort();

                return singular ? modelInstances[0] : modelInstances;
            },
        },
        {
            key: 'remove',
            value: function remove(models) {
                var _this3 = this;

                var singular = !isArray(models);
                models = singular ? [models] : models.slice();

                models.forEach(function(model) {
                    return _this3.models.remove(model);
                });

                return models;
            },
        },
        {
            key: 'removeById',
            value: function removeById(ids) {
                var _this4 = this;

                var singular = !isArray(ids);
                ids = singular ? [ids] : ids.slice();
                invariant(
                    !ids.some(isNaN),
                    'Cannot remove a model by id that is not a number: ' +
                        JSON.stringify(ids)
                );

                var models = ids.map(function(id) {
                    return _this4.get(id);
                });

                models.forEach(function(model) {
                    if (model) {
                        _this4.models.remove(model);
                    }
                });

                return models;
            },
        },
        {
            key: 'clear',
            value: function clear() {
                this.models.clear();
            },
        },
        {
            key: 'fetch',
            value: function fetch() {
                var _this5 = this;

                var options =
                    arguments.length > 0 && arguments[0] !== undefined
                        ? arguments[0]
                        : {};

                this.__pendingRequestCount += 1;
                var data = Object.assign(
                    this.__getApi().buildFetchStoreParams(this),
                    this.params,
                    options.data
                );
                return this.__getApi()
                    .fetchStore({
                        url: options.url || result(this, 'url'),
                        data: data,
                        requestOptions: omit(options, 'data'),
                    })
                    .then(
                        action(function(res) {
                            _this5.__pendingRequestCount -= 1;
                            _this5.__state.totalRecords = res.totalRecords;
                            _this5.fromBackend(res);
                        })
                    );
            },
        },
        {
            key: '__parseNewIds',
            value: function __parseNewIds(idMaps) {
                this.each(function(model) {
                    return model.__parseNewIds(idMaps);
                });
            },
        },
        {
            key: 'toJS',
            value: function toJS$$1() {
                return this.models.map(function(model) {
                    return model.toJS();
                });
            },

            // Methods for pagination.
        },
        {
            key: 'getPageOffset',
            value: function getPageOffset() {
                return (this.__state.currentPage - 1) * this.__state.limit;
            },
        },
        {
            key: 'setLimit',
            value: function setLimit(limit) {
                invariant(
                    !limit || Number.isInteger(limit),
                    'Page limit should be a number or falsy value.'
                );
                this.__state.limit = limit || null;
            },
        },
        {
            key: 'getNextPage',
            value: function getNextPage() {
                invariant(this.hasNextPage, 'There is no next page.');
                this.__state.currentPage += 1;
                return this.fetch();
            },
        },
        {
            key: 'getPreviousPage',
            value: function getPreviousPage() {
                invariant(this.hasPreviousPage, 'There is no previous page.');
                this.__state.currentPage -= 1;
                return this.fetch();
            },
        },
        {
            key: 'setPage',
            value: function setPage() {
                var page =
                    arguments.length > 0 && arguments[0] !== undefined
                        ? arguments[0]
                        : 1;
                var options =
                    arguments.length > 1 && arguments[1] !== undefined
                        ? arguments[1]
                        : {};

                invariant(
                    Number.isInteger(page) && page >= 1,
                    'Page should be a number above 1.'
                );
                this.__state.currentPage = page;
                if (options.fetch === undefined || options.fetch) {
                    return this.fetch();
                }
                invariant(
                    page <= this.totalPages,
                    'Page should be between 1 and ' + this.totalPages + '.'
                );
                return Promise.resolve();
            },
        },
        {
            key: 'toBackendAll',
            value: function toBackendAll() {
                var _this6 = this;

                var newIds =
                    arguments.length > 0 && arguments[0] !== undefined
                        ? arguments[0]
                        : [];
                var options =
                    arguments.length > 1 && arguments[1] !== undefined
                        ? arguments[1]
                        : {};

                var modelData = this.models.map(function(model, i) {
                    return model.toBackendAll(
                        newIds && newIds[i] !== undefined ? newIds[i] : null,
                        {
                            relations: options.relations,
                            onlyChanges: options.onlyChanges,
                        }
                    );
                });

                var data = [];
                var relations = {};

                modelData.forEach(function(model) {
                    data = data.concat(model.data);
                    forIn(model.relations, function(relModel, key) {
                        relations[key] = relations[key]
                            ? relations[key].concat(relModel)
                            : relModel;
                        // TODO: this primaryKey is not the primaryKey of the relation we're de-duplicating...
                        relations[key] = uniqBy(
                            relations[key],
                            _this6.Model.primaryKey
                        );
                    });
                });

                return { data: data, relations: relations };
            },

            // Create a new instance of this store with a predicate applied.
            // This new store will be automatically kept in-sync with all models that adhere to the predicate.
        },
        {
            key: 'virtualStore',
            value: function virtualStore(_ref2) {
                var _this7 = this;

                var filter$$1 = _ref2.filter,
                    comparator = _ref2.comparator;

                var store = new this.constructor({
                    relations: this.__activeRelations,
                    comparator: comparator,
                });
                // Oh gawd MobX is so awesome.
                var events = autorun(function() {
                    var models = _this7.filter(filter$$1);
                    store.models.replace(models);
                    store.sort();
                });
                store.unsubscribeVirtualStore = events;
                return store;
            },

            // Helper methods to read models.
        },
        {
            key: 'get',
            value: function get$$1(id) {
                // The id can be defined as a string or int, but we want it to work in both cases.
                return this.models.find(
                    function(model) {
                        return model[model.constructor.primaryKey] == id;
                    } // eslint-disable-line eqeqeq
                );
            },
        },
        {
            key: 'getByIds',
            value: function getByIds(ids) {
                return this.models.filter(function(model) {
                    var id = model[model.constructor.primaryKey];
                    return ids.includes(id) || ids.includes('' + id);
                });
            },
        },
        {
            key: 'map',
            value: function map$$1(predicate) {
                return map(this.models, predicate);
            },
        },
        {
            key: 'mapByPrimaryKey',
            value: function mapByPrimaryKey() {
                return this.map(this.Model.primaryKey);
            },
        },
        {
            key: 'filter',
            value: function filter$$1(predicate) {
                return filter(this.models, predicate);
            },
        },
        {
            key: 'find',
            value: function find$$1(predicate) {
                return find(this.models, predicate);
            },
        },
        {
            key: 'each',
            value: function each$$1(predicate) {
                return this.models.forEach(predicate);
            },
        },
        {
            key: 'forEach',
            value: function forEach(predicate) {
                return this.models.forEach(predicate);
            },
        },
        {
            key: 'sortBy',
            value: function sortBy$$1(iteratees) {
                return sortBy(this.models, iteratees);
            },
        },
        {
            key: 'at',
            value: function at(index) {
                var zeroLength = this.length - 1;
                invariant(
                    index <= zeroLength,
                    'Index ' +
                        index +
                        ' is out of bounds (max ' +
                        zeroLength +
                        ').'
                );
                if (index < 0) {
                    index += this.length;
                }
                return this.models[index];
            },
        },
        {
            key: 'totalPages',
            get: function get$$1() {
                if (!this.__state.limit) {
                    return 0;
                }
                return Math.ceil(
                    this.__state.totalRecords / this.__state.limit
                );
            },
        },
        {
            key: 'currentPage',
            get: function get$$1() {
                return this.__state.currentPage;
            },
        },
        {
            key: 'hasNextPage',
            get: function get$$1() {
                return this.__state.currentPage + 1 <= this.totalPages;
            },
        },
        {
            key: 'hasPreviousPage',
            get: function get$$1() {
                return this.__state.currentPage > 1;
            },
        },
        {
            key: 'hasUserChanges',
            get: function get$$1() {
                return this.models.some(function(m) {
                    return m.hasUserChanges;
                });
            },
        },
    ]);
    return Store;
})()),
(_class2.backendResourceName = ''),
_temp)),
(_descriptor = _applyDecoratedDescriptor(
    _class.prototype,
    'models',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return [];
        },
    }
)),
(_descriptor2 = _applyDecoratedDescriptor(
    _class.prototype,
    'params',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {};
        },
    }
)),
(_descriptor3 = _applyDecoratedDescriptor(
    _class.prototype,
    '__pendingRequestCount',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return 0;
        },
    }
)),
(_descriptor4 = _applyDecoratedDescriptor(
    _class.prototype,
    '__state',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {
                currentPage: 1,
                limit: 25,
                totalRecords: 0,
            };
        },
    }
)),
_applyDecoratedDescriptor(
    _class.prototype,
    'isLoading',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'isLoading'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'length',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'length'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'fromBackend',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'fromBackend'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'sort',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'sort'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'parse',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'parse'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'add',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'add'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'remove',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'remove'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'removeById',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'removeById'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'clear',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'clear'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'fetch',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'fetch'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'setLimit',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'setLimit'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'totalPages',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'totalPages'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'currentPage',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'currentPage'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'hasNextPage',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'hasNextPage'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'hasPreviousPage',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'hasPreviousPage'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'getNextPage',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'getNextPage'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'getPreviousPage',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'getPreviousPage'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'setPage',
    [action],
    Object.getOwnPropertyDescriptor(_class.prototype, 'setPage'),
    _class.prototype
),
_applyDecoratedDescriptor(
    _class.prototype,
    'hasUserChanges',
    [computed],
    Object.getOwnPropertyDescriptor(_class.prototype, 'hasUserChanges'),
    _class.prototype
),
_class);

var _class$1,
    _descriptor$1,
    _descriptor2$1,
    _descriptor3$1,
    _descriptor4$1,
    _class2$1,
    _temp$1;

function _initDefineProp$1(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
        writable: descriptor.writable,
        value: descriptor.initializer
            ? descriptor.initializer.call(context)
            : void 0,
    });
}

function _applyDecoratedDescriptor$1(
    target,
    property,
    decorators,
    descriptor,
    context
) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function(key) {
        desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
        desc.writable = true;
    }

    desc = decorators
        .slice()
        .reverse()
        .reduce(function(desc, decorator) {
            return decorator(target, property, desc) || desc;
        }, desc);

    if (context && desc.initializer !== void 0) {
        desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
        desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
        Object['define' + 'Property'](target, property, desc);
        desc = null;
    }

    return desc;
}

function concatInDict(dict, key, value) {
    dict[key] = dict[key] ? dict[key].concat(value) : value;
}

// Find the relation name before the first dot, and include all other relations after it
// Example: input `animal.kind.breed` output -> `['animal', 'kind.breed']`
var RE_SPLIT_FIRST_RELATION = /([^.]+)\.(.+)/;

// TODO: find a way to get a list of existing properties automatically.
var FORBIDDEN_ATTRS = [
    'url',
    'urlRoot',
    'api',
    'isNew',
    'isLoading',
    'parse',
    'save',
    'clear',
];

var Model = ((_class$1 = ((_temp$1 = _class2$1 = (function() {
    createClass(Model, [
        {
            key: 'urlRoot',
            value: function urlRoot() {
                // Try to auto-generate the URL.
                var bname = this.constructor.backendResourceName;
                if (bname) {
                    return '/' + bname + '/';
                }
                return null;
            },
            // How the model is known at the backend. This is useful when the model is in a relation that has a different name.

            // Holds original attributes with values, so `clear()` knows what to reset to (quite ugly).

            // Holds activated - nested - relations (e.g. `['animal', 'animal.breed']`)

            // Holds activated - non-nested - relations (e.g. `['animal']`)

            // A `cid` can be used to identify the model locally.

            // URL query params that are added to fetch requests.

            // Holds fields (attrs+relations) that have been changed via setInput()
        },
        {
            key: 'getNegativeId',

            // Useful to reference to this model in a relation - that is not yet saved to the backend.
            value: function getNegativeId() {
                return -parseInt(this.cid.replace('m', ''));
            },
        },
        {
            key: 'getInternalId',
            value: function getInternalId() {
                if (this.isNew) {
                    return this.getNegativeId();
                }
                return this[this.constructor.primaryKey];
            },
        },
        {
            key: 'casts',
            value: function casts() {
                return {};
            },

            // Empty function, but can be overridden if you want to do something after initializing the model.
        },
        {
            key: 'initialize',
            value: function initialize() {},
        },
        {
            key: 'url',
            get: function get$$1() {
                var id = this[this.constructor.primaryKey];
                return '' + result(this, 'urlRoot') + (id ? id + '/' : '');
            },
        },
        {
            key: 'isNew',
            get: function get$$1() {
                return !this[this.constructor.primaryKey];
            },
        },
        {
            key: 'isLoading',
            get: function get$$1() {
                return this.__pendingRequestCount > 0;
            },
        },
        {
            key: 'primaryKey',
            set: function set$$1(v) {
                invariant(
                    false,
                    '`primaryKey` should be a static property on the model.'
                );
            },
        },
        {
            key: 'backendResourceName',
            set: function set$$1(v) {
                invariant(
                    false,
                    '`backendResourceName` should be a static property on the model.'
                );
            },
        },
    ]);

    function Model(data) {
        var _this = this;

        var options =
            arguments.length > 1 && arguments[1] !== undefined
                ? arguments[1]
                : {};
        classCallCheck(this, Model);
        this.__attributes = [];
        this.__originalAttributes = {};
        this.__activeRelations = [];
        this.__activeCurrentRelations = [];
        this.api = null;
        this.cid = 'm' + uniqueId();

        _initDefineProp$1(
            this,
            '__backendValidationErrors',
            _descriptor$1,
            this
        );

        _initDefineProp$1(this, '__pendingRequestCount', _descriptor2$1, this);

        _initDefineProp$1(this, '__fetchParams', _descriptor3$1, this);

        _initDefineProp$1(this, '__changes', _descriptor4$1, this);

        this.__store = options.store;
        this.__repository = options.repository;
        // Find all attributes. Not all observables are an attribute.
        forIn(this, function(value, key) {
            if (!key.startsWith('__') && isObservable(_this, key)) {
                invariant(
                    !FORBIDDEN_ATTRS.includes(key),
                    'Forbidden attribute key used: `' + key + '`'
                );
                _this.__attributes.push(key);
                var newValue = value;
                // An array or object observable can be mutated, so we want to ensure we always have
                // the original not-yet-mutated object/array.
                if (isObservableArray(value)) {
                    newValue = value.slice();
                } else if (isObservableObject(value)) {
                    newValue = Object.assign({}, value);
                }
                _this.__originalAttributes[key] = newValue;
            }
        });
        this.__parseRelations(options.relations || []);
        if (data) {
            this.parse(data);
        }
        this.initialize();
    }

    createClass(
        Model,
        [
            {
                key: '__parseRelations',
                value: function __parseRelations(activeRelations) {
                    var _this2 = this;

                    this.__activeRelations = activeRelations;
                    // TODO: No idea why getting the relations only works when it's a Function.
                    var relations = this.relations && this.relations();
                    var relModels = {};
                    activeRelations.forEach(function(aRel) {
                        // If aRel is null, this relation is already defined by another aRel
                        // IE.: town.restaurants.chef && town
                        if (aRel === null) {
                            return;
                        }
                        var relNames = aRel.match(RE_SPLIT_FIRST_RELATION);

                        var currentRel = relNames ? relNames[1] : aRel;
                        var otherRelNames = relNames && relNames[2];
                        var currentProp = relModels[currentRel];
                        var otherRels = otherRelNames && [otherRelNames];

                        // When two nested relations are defined next to each other (e.g. `['kind.breed', 'kind.location']`),
                        // the relation `kind` only needs to be initialized once.
                        relModels[currentRel] = currentProp
                            ? currentProp.concat(otherRels)
                            : otherRels;
                        invariant(
                            !_this2.__attributes.includes(currentRel),
                            'Cannot define `' +
                                currentRel +
                                '` as both an attribute and a relation. You probably need to remove the attribute.'
                        );
                        if (
                            !_this2.__activeCurrentRelations.includes(
                                currentRel
                            )
                        ) {
                            _this2.__activeCurrentRelations.push(currentRel);
                        }
                    });

                    var relationIds = {};
                    each(relations, function(rel, relName) {
                        relationIds[relName + 'Id'] = null;
                    });

                    extendObservable(
                        this,
                        mapValues(relModels, function(otherRelNames, relName) {
                            var RelModel = relations[relName];
                            invariant(
                                RelModel,
                                'Specified relation "' +
                                    relName +
                                    '" does not exist on model.'
                            );
                            var options = { relations: otherRelNames };
                            if (RelModel.prototype instanceof Store) {
                                return new RelModel(options);
                            }
                            return new RelModel(null, options);
                        }),
                        relationIds
                    );
                },

                // Many backends use snake_case for attribute names, so we convert to snake_case by default.
            },
            {
                key: 'toBackend',
                value: function toBackend() {
                    var _this3 = this;

                    var options =
                        arguments.length > 0 && arguments[0] !== undefined
                            ? arguments[0]
                            : {};

                    var output = {};
                    // By default we'll include all fields (attributes+relations), but sometimes you might want to specify the fields to be included.
                    var fieldFilter = function fieldFilter(field) {
                        if (options.fields) {
                            return options.fields.includes(field);
                        }
                        if (!_this3.isNew && options.onlyChanges) {
                            var forceFields = options.forceFields || [];
                            return (
                                forceFields.includes(field) ||
                                _this3.__changes.includes(field)
                            );
                        }
                        return true;
                    };
                    this.__attributes
                        .filter(fieldFilter)
                        .forEach(function(attr) {
                            if (!attr.startsWith('_')) {
                                output[
                                    _this3.constructor.toBackendAttrKey(attr)
                                ] = _this3.__toJSAttr(attr, _this3[attr]);
                            }
                        });

                    // Primary key is always forced to be included.
                    output[this.constructor.primaryKey] = this[
                        this.constructor.primaryKey
                    ];

                    // Add active relations as id.
                    this.__activeCurrentRelations
                        .filter(fieldFilter)
                        .forEach(function(currentRel) {
                            var rel = _this3[currentRel];
                            var relBackendName = _this3.constructor.toBackendAttrKey(
                                currentRel
                            );
                            if (rel instanceof Model) {
                                output[relBackendName] =
                                    rel[rel.constructor.primaryKey];
                            }
                            if (rel instanceof Store) {
                                output[relBackendName] = rel.mapByPrimaryKey();
                            }
                        });
                    return output;
                },
            },
            {
                key: 'toBackendAll',
                value: function toBackendAll(newId) {
                    var _this4 = this;

                    var options =
                        arguments.length > 1 && arguments[1] !== undefined
                            ? arguments[1]
                            : {};

                    // TODO: This implementation is more a proof of concept; it's very shitty coded.
                    var includeRelations = options.relations || [];
                    var firstLevelRelations = uniq(
                        includeRelations.map(function(rel) {
                            return rel.split('.')[0];
                        })
                    );
                    var data = this.toBackend({
                        onlyChanges: options.onlyChanges,
                        forceFields: firstLevelRelations,
                    });
                    var relations = {};

                    if (newId) {
                        data[this.constructor.primaryKey] = newId;
                    } else if (data[this.constructor.primaryKey] === null) {
                        data[
                            this.constructor.primaryKey
                        ] = this.getNegativeId();
                    }

                    this.__activeCurrentRelations.forEach(function(currentRel) {
                        var rel = _this4[currentRel];
                        var myNewId = null;
                        var relBackendName = _this4.constructor.toBackendAttrKey(
                            currentRel
                        );

                        // `includeRelations` can look like `['kind.breed', 'owner']`
                        // Check to see if `currentRel` matches the first part of the relation (`kind` or `owner`)
                        var includeRelationData = includeRelations.filter(
                            function(rel) {
                                var nestedRels = rel.split('.');
                                return nestedRels.length > 0
                                    ? nestedRels[0] === currentRel
                                    : false;
                            }
                        );
                        if (includeRelationData.length > 0) {
                            if (data[relBackendName] === null) {
                                myNewId = rel.getNegativeId();
                                data[relBackendName] = myNewId;
                            } else if (isArray(data[relBackendName])) {
                                myNewId = data[relBackendName].map(function(
                                    id,
                                    idx
                                ) {
                                    return id === null
                                        ? rel.at(idx).getNegativeId()
                                        : id;
                                });
                                data[relBackendName] = uniq(myNewId);
                            }

                            // We want to pass through nested relations to the next relation, but pop of the first level.
                            var relativeRelations = includeRelationData
                                .map(function(rel) {
                                    var nestedRels = rel.split('.');
                                    nestedRels.shift();
                                    return nestedRels.join('.');
                                })
                                .filter(function(rel) {
                                    return !!rel;
                                });
                            var relBackendData = rel.toBackendAll(myNewId, {
                                relations: relativeRelations,
                                onlyChanges: options.onlyChanges,
                            });
                            // Sometimes the backend knows the relation by a different name, e.g. the relation is called
                            // `activities`, but the name in the backend is `activity`.
                            // In that case, you can add `static backendResourceName = 'activity';` to that model.
                            var realBackendName =
                                rel.constructor.backendResourceName ||
                                relBackendName;
                            concatInDict(
                                relations,
                                realBackendName,
                                relBackendData.data
                            );

                            // De-duplicate relations based on `primaryKey`.
                            relations[realBackendName] = uniqBy(
                                relations[realBackendName],
                                rel.constructor.primaryKey ||
                                    rel.Model.primaryKey
                            );

                            forIn(relBackendData.relations, function(
                                relB,
                                key
                            ) {
                                concatInDict(relations, key, relB);
                            });
                        }
                    });

                    return { data: [data], relations: relations };
                },
            },
            {
                key: 'toJS',
                value: function toJS$$1() {
                    var _this5 = this;

                    var output = {};
                    this.__attributes.forEach(function(attr) {
                        output[attr] = _this5.__toJSAttr(attr, _this5[attr]);
                    });

                    this.__activeCurrentRelations.forEach(function(currentRel) {
                        var model = _this5[currentRel];
                        if (model) {
                            output[currentRel] = model.toJS();
                        }
                    });
                    return output;
                },
            },
            {
                key: '__toJSAttr',
                value: function __toJSAttr(attr, value) {
                    var casts = this.casts();
                    var cast = casts[attr];
                    if (cast !== undefined) {
                        return toJS(cast.toJS(attr, value));
                    }
                    return toJS(value);
                },
            },
            {
                key: 'setFetchParams',
                value: function setFetchParams(params) {
                    this.__fetchParams = Object.assign({}, params);
                },
            },
            {
                key: '__parseRepositoryToData',
                value: function __parseRepositoryToData(key, repository) {
                    if (isArray(key)) {
                        return filter(repository, function(m) {
                            return key.includes(m.id);
                        });
                    }
                    return find(repository, { id: key });
                },

                /**
                 * We handle the fromBackend recursively.
                 * But when recursing, we don't send the full repository, we need to only send the repo
                 * relevant to the relation.
                 *
                 * So when we have a customer with a town.restaurants relation,
                 * we get a "town.restaurants": "restaurant", relMapping from Binder
                 *
                 * Here we create a scoped repository.
                 * The root gets a `town.restaurants` repo, but the `town` relation only gets the `restaurants` repo
                 */
            },
            {
                key: '__scopeBackendResponse',
                value: function __scopeBackendResponse(_ref) {
                    var _this6 = this;

                    var data = _ref.data,
                        targetRelName = _ref.targetRelName,
                        repos = _ref.repos,
                        mapping = _ref.mapping;

                    var scopedData = null;
                    var relevant = false;
                    var scopedRepos = {};
                    var scopedRelMapping = {};

                    forIn(mapping, function(repoName, relName) {
                        var repository = repos[repoName];
                        relName = _this6.constructor.fromBackendAttrKey(
                            relName
                        );

                        if (!data) {
                            return null;
                        }

                        if (targetRelName === relName) {
                            relevant = true;
                            var relKey =
                                data[
                                    _this6.constructor.toBackendAttrKey(relName)
                                ];
                            scopedData = _this6.__parseRepositoryToData(
                                relKey,
                                repository
                            );
                            return;
                        }

                        if (relName.startsWith(targetRelName + '.')) {
                            // If we have town.restaurants and the targetRel = town
                            // we need "restaurants" in the repository
                            relevant = true;
                            var relNames = relName.match(
                                RE_SPLIT_FIRST_RELATION
                            );
                            var scopedRelName = relNames[2];
                            scopedRepos[repoName] = repository;
                            scopedRelMapping[scopedRelName] = repoName;
                        }
                    });

                    if (!relevant) {
                        return null;
                    }

                    return {
                        scopedData: scopedData,
                        scopedRepos: scopedRepos,
                        scopedRelMapping: scopedRelMapping,
                    };
                },

                // `data` contains properties for the current model.
                // `repos` is an object of "repositories". A repository is
                // e.g. "animal_kind", while the relation name would be "kind".
                // `relMapping` maps relation names to repositories.
            },
            {
                key: 'fromBackend',
                value: function fromBackend(_ref2) {
                    var _this7 = this;

                    var data = _ref2.data,
                        repos = _ref2.repos,
                        relMapping = _ref2.relMapping;

                    // We handle the fromBackend recursively. On each relation of the source model
                    // fromBackend gets called as well, but with data scoped for itself
                    //
                    // So when we have a model with a `town.restaurants.chef` relation,
                    // we call fromBackend on the `town` relation.
                    each(this.__activeCurrentRelations, function(relName) {
                        var rel = _this7[relName];
                        var resScoped = _this7.__scopeBackendResponse({
                            data: data,
                            targetRelName: relName,
                            repos: repos,
                            mapping: relMapping,
                        });

                        // Make sure we don't parse every relation for nothing
                        if (!resScoped) {
                            return;
                        }
                        var scopedData = resScoped.scopedData,
                            scopedRepos = resScoped.scopedRepos,
                            scopedRelMapping = resScoped.scopedRelMapping;

                        rel.fromBackend({
                            data: scopedData,
                            repos: scopedRepos,
                            relMapping: scopedRelMapping,
                        });
                    });

                    // Now all repositories are set on the relations, start parsing the actual data.
                    // `parse()` will recursively fill in all relations.
                    if (data) {
                        this.parse(data);
                    }
                },
            },
            {
                key: '__getApi',
                value: function __getApi() {
                    invariant(
                        this.api,
                        'You are trying to perform a API request without an `api` property defined on the model.'
                    );
                    invariant(
                        result(this, 'urlRoot'),
                        'You are trying to perform a API request without an `urlRoot` property defined on the model.'
                    );
                    return this.api;
                },
            },
            {
                key: 'parse',
                value: function parse(data) {
                    var _this8 = this;

                    invariant(
                        isPlainObject(data),
                        'Parameter supplied to `parse()` is not an object, got: ' +
                            JSON.stringify(data)
                    );
                    var relations = this.relations ? this.relations() : [];
                    var localRelations = Object.keys(relations);
                    forIn(data, function(value, key) {
                        var attr = _this8.constructor.fromBackendAttrKey(key);
                        if (_this8.__attributes.includes(attr)) {
                            _this8[attr] = _this8.__parseAttr(attr, value);
                        } else if (localRelations.includes(attr)) {
                            _this8[attr + 'Id'] = value;
                            if (
                                _this8.__activeCurrentRelations.includes(attr)
                            ) {
                                // In Binder, a relation property is an `int` or `[int]`, referring to its ID.
                                // However, it can also be an object if there are nested relations (non flattened).
                                if (
                                    isPlainObject(value) ||
                                    isPlainObject(get(value, '[0]'))
                                ) {
                                    _this8[attr].parse(value);
                                }
                            }
                        }
                    });

                    return this;
                },
            },
            {
                key: '__parseAttr',
                value: function __parseAttr(attr, value) {
                    var casts = this.casts();
                    var cast = casts[attr];
                    if (cast !== undefined) {
                        return cast.parse(attr, value);
                    }
                    return value;
                },
            },
            {
                key: 'save',
                value: function save() {
                    var _this9 = this;

                    var options =
                        arguments.length > 0 && arguments[0] !== undefined
                            ? arguments[0]
                            : {};

                    this.clearValidationErrors();
                    this.__pendingRequestCount += 1;
                    return this.__getApi()
                        .saveModel({
                            url: options.url || this.url,
                            data: this.toBackend({
                                fields: options.fields,
                                onlyChanges: options.onlyChanges,
                            }),
                            isNew: this.isNew,
                            requestOptions: omit(options, 'url'),
                        })
                        .then(
                            action(function(res) {
                                _this9.__pendingRequestCount -= 1;
                                _this9.saveFromBackend(res);
                            })
                        )
                        .catch(
                            action(function(err) {
                                _this9.__pendingRequestCount -= 1;
                                if (err.valErrors) {
                                    _this9.parseValidationErrors(err.valErrors);
                                }
                                throw err;
                            })
                        );
                },
            },
            {
                key: 'setInput',
                value: function setInput(name, value) {
                    invariant(
                        this.__attributes.includes(name) ||
                            this.__activeCurrentRelations.includes(name),
                        'Field `' + name + '` does not exist on the model.'
                    );
                    if (!this.__changes.includes(name)) {
                        this.__changes.push(name);
                    }
                    if (this.__activeCurrentRelations.includes(name)) {
                        if (isArray(value)) {
                            this[name].clear();
                            this[name].add(
                                value.map(function(v) {
                                    return v.toJS();
                                })
                            );
                        } else if (value) {
                            this[name].parse(value.toJS());
                        } else {
                            this[name].clear();
                        }
                    } else {
                        this[name] = value;
                    }
                    if (this.backendValidationErrors[name]) {
                        this.__backendValidationErrors = Object.assign(
                            this.backendValidationErrors,
                            defineProperty({}, name, undefined)
                        );
                    }
                },
            },
            {
                key: 'saveAll',
                value: function saveAll() {
                    var _this10 = this;

                    var options =
                        arguments.length > 0 && arguments[0] !== undefined
                            ? arguments[0]
                            : {};

                    this.clearValidationErrors();
                    this.__pendingRequestCount += 1;
                    return this.__getApi()
                        .saveAllModels({
                            url: result(this, 'urlRoot'),
                            model: this,
                            data: this.toBackendAll(null, {
                                relations: options.relations,
                                onlyChanges: options.onlyChanges,
                            }),
                            requestOptions: omit(options, 'relations'),
                        })
                        .then(
                            action(function(res) {
                                _this10.__pendingRequestCount -= 1;
                                _this10.saveFromBackend(res);
                            })
                        )
                        .catch(
                            action(function(err) {
                                _this10.__pendingRequestCount -= 1;
                                if (err.valErrors) {
                                    _this10.parseValidationErrors(
                                        err.valErrors
                                    );
                                }
                                throw err;
                            })
                        );
                },

                // After saving a model, we should get back an ID mapping from the backend which looks like:
                // `{ "animal": [[-1, 10]] }`
            },
            {
                key: '__parseNewIds',
                value: function __parseNewIds(idMaps) {
                    var _this11 = this;

                    var bName = this.constructor.backendResourceName;
                    if (bName && idMaps[bName]) {
                        var idMap = idMaps[bName].find(function(ids) {
                            return ids[0] === _this11.getInternalId();
                        });
                        if (idMap) {
                            this[this.constructor.primaryKey] = idMap[1];
                        }
                    }
                    each(this.__activeCurrentRelations, function(relName) {
                        var rel = _this11[relName];
                        rel.__parseNewIds(idMaps);
                    });
                },
            },
            {
                key: 'parseValidationErrors',
                value: function parseValidationErrors(valErrors) {
                    var _this12 = this;

                    var bname = this.constructor.backendResourceName;

                    if (valErrors[bname]) {
                        var id = this.getInternalId();
                        // When there is no id or negative id, the backend may use the string 'null'. Bit weird, but eh.
                        var errorsForModel =
                            valErrors[bname][id] || valErrors[bname]['null'];
                        if (errorsForModel) {
                            var camelCasedErrors = mapKeys(
                                errorsForModel,
                                function(value, key) {
                                    return snakeToCamel(key);
                                }
                            );
                            var formattedErrors = mapValues(
                                camelCasedErrors,
                                function(valError) {
                                    return valError.map(function(obj) {
                                        return obj.code;
                                    });
                                }
                            );
                            this.__backendValidationErrors = formattedErrors;
                        }
                    }

                    this.__activeCurrentRelations.forEach(function(currentRel) {
                        _this12[currentRel].parseValidationErrors(valErrors);
                    });
                },
            },
            {
                key: 'clearValidationErrors',
                value: function clearValidationErrors() {
                    var _this13 = this;

                    this.__backendValidationErrors = {};
                    this.__activeCurrentRelations.forEach(function(currentRel) {
                        _this13[currentRel].clearValidationErrors();
                    });
                },

                // This is just a pass-through to make it easier to override parsing backend responses from the backend.
                // Sometimes the backend won't return the model after a save because e.g. it is created async.
            },
            {
                key: 'saveFromBackend',
                value: function saveFromBackend(res) {
                    return this.fromBackend(res);
                },

                // TODO: This is a bit hacky...
            },
            {
                key: 'delete',
                value: function _delete() {
                    var _this14 = this;

                    var options =
                        arguments.length > 0 && arguments[0] !== undefined
                            ? arguments[0]
                            : {};

                    var removeFromStore = function removeFromStore() {
                        return _this14.__store
                            ? _this14.__store.remove(_this14)
                            : null;
                    };
                    if (options.immediate || this.isNew) {
                        removeFromStore();
                    }
                    if (this.isNew) {
                        return Promise.resolve();
                    }

                    this.__pendingRequestCount += 1;
                    return this.__getApi()
                        .deleteModel({
                            url: options.url || this.url,
                            requestOptions: omit(options, ['immediate', 'url']),
                        })
                        .then(
                            action(function() {
                                _this14.__pendingRequestCount -= 1;
                                if (!options.immediate) {
                                    removeFromStore();
                                }
                            })
                        );
                },
            },
            {
                key: 'fetch',
                value: function fetch() {
                    var _this15 = this;

                    var options =
                        arguments.length > 0 && arguments[0] !== undefined
                            ? arguments[0]
                            : {};

                    invariant(!this.isNew, 'Trying to fetch model without id!');
                    this.__pendingRequestCount += 1;
                    var data = Object.assign(
                        this.__getApi().buildFetchModelParams(this),
                        this.__fetchParams,
                        options.data
                    );
                    return this.__getApi()
                        .fetchModel({
                            url: options.url || this.url,
                            data: data,
                            requestOptions: omit(options, ['data', 'url']),
                        })
                        .then(
                            action(function(res) {
                                _this15.fromBackend(res);
                                _this15.__pendingRequestCount -= 1;
                            })
                        );
                },
            },
            {
                key: 'clear',
                value: function clear() {
                    var _this16 = this;

                    forIn(this.__originalAttributes, function(value, key) {
                        _this16[key] = value;
                    });

                    this.__activeCurrentRelations.forEach(function(currentRel) {
                        _this16[currentRel].clear();
                    });
                },
            },
            {
                key: 'hasUserChanges',
                get: function get$$1() {
                    var _this17 = this;

                    if (this.__changes.length > 0) {
                        return true;
                    }
                    return this.__activeCurrentRelations.some(function(rel) {
                        return _this17[rel].hasUserChanges;
                    });
                },
            },
            {
                key: 'backendValidationErrors',
                get: function get$$1() {
                    return this.__backendValidationErrors;
                },
            },
        ],
        [
            {
                key: 'toBackendAttrKey',
                value: function toBackendAttrKey(attrKey) {
                    return camelToSnake(attrKey);
                },

                // In the frontend we don't want to deal with those snake_case attr names.
            },
            {
                key: 'fromBackendAttrKey',
                value: function fromBackendAttrKey(attrKey) {
                    return snakeToCamel(attrKey);
                },
            },
        ]
    );
    return Model;
})()),
(_class2$1.primaryKey = 'id'),
(_class2$1.backendResourceName = ''),
_temp$1)),
(_descriptor$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__backendValidationErrors',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {};
        },
    }
)),
(_descriptor2$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__pendingRequestCount',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return 0;
        },
    }
)),
(_descriptor3$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__fetchParams',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return {};
        },
    }
)),
(_descriptor4$1 = _applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__changes',
    [observable],
    {
        enumerable: true,
        initializer: function initializer() {
            return [];
        },
    }
)),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'url',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'url'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'isNew',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'isNew'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'isLoading',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'isLoading'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    '__parseRelations',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, '__parseRelations'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'hasUserChanges',
    [computed],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'hasUserChanges'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'fromBackend',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'fromBackend'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'parse',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'parse'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'save',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'save'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'setInput',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'setInput'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'saveAll',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'saveAll'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'parseValidationErrors',
    [action],
    Object.getOwnPropertyDescriptor(
        _class$1.prototype,
        'parseValidationErrors'
    ),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'clearValidationErrors',
    [action],
    Object.getOwnPropertyDescriptor(
        _class$1.prototype,
        'clearValidationErrors'
    ),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'backendValidationErrors',
    [computed],
    Object.getOwnPropertyDescriptor(
        _class$1.prototype,
        'backendValidationErrors'
    ),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'delete',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'delete'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'fetch',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'fetch'),
    _class$1.prototype
),
_applyDecoratedDescriptor$1(
    _class$1.prototype,
    'clear',
    [action],
    Object.getOwnPropertyDescriptor(_class$1.prototype, 'clear'),
    _class$1.prototype
),
_class$1);

// Function ripped from Django docs.
// See: https://docs.djangoproject.com/en/dev/ref/csrf/#ajax
function csrfSafeMethod(method) {
    // These HTTP methods do not require CSRF protection.
    return /^(GET|HEAD|OPTIONS|TRACE)$/i.test(method);
}

function parseBackendValidationErrors(response) {
    var valErrors = get(response, 'data.errors');
    if (response.status === 400 && valErrors) {
        return valErrors;
    }
    return null;
}

var BinderApi = (function() {
    function BinderApi() {
        classCallCheck(this, BinderApi);
        this.baseUrl = null;
        this.csrfToken = null;
        this.defaultHeaders = {};
        this.axios = axios.create();

        this.__initializeCsrfHandling();
    }

    createClass(BinderApi, [
        {
            key: '__initializeCsrfHandling',
            value: function __initializeCsrfHandling() {
                var _this = this;

                this.axios.interceptors.response.use(null, function(err) {
                    var status = get(err, 'response.status');
                    var statusErrCode = get(err, 'response.data.code');
                    var doNotRetry = get(err, 'response.config.doNotRetry');
                    if (
                        status === 403 &&
                        statusErrCode === 'CSRFFailure' &&
                        !doNotRetry
                    ) {
                        return _this.fetchCsrfToken().then(function() {
                            return _this.axios(
                                _extends({}, err.response.config, {
                                    doNotRetry: true,
                                })
                            );
                        });
                    }
                    return Promise.reject(err);
                });
            },
        },
        {
            key: '__request',
            value: function __request(method, url, data, options) {
                options || (options = {});
                var useCsrfToken = csrfSafeMethod(method)
                    ? undefined
                    : this.csrfToken;
                this.__testUrl(url);

                var axiosOptions = {
                    method: method,
                    baseURL: this.baseUrl,
                    url: url,
                    data: method !== 'get' && data ? data : undefined,
                    params: method === 'get' && data ? data : options.params,
                };

                Object.assign(axiosOptions, options);

                // Don't clear existing headers when adding `options.headers`
                var headers = Object.assign(
                    {
                        'Content-Type': 'application/json',
                        'X-Csrftoken': useCsrfToken,
                    },
                    this.defaultHeaders,
                    options.headers
                );
                axiosOptions.headers = headers;

                var xhr = this.axios(axiosOptions);

                // We fork the promise tree as we want to have the error traverse to the listeners
                if (this.onRequestError && options.skipRequestError !== true) {
                    xhr.catch(this.onRequestError);
                }

                var onSuccess =
                    options.skipFormatter === true
                        ? Promise.resolve()
                        : this.__responseFormatter;
                return xhr.then(onSuccess);
            },
        },
        {
            key: 'fetchCsrfToken',
            value: function fetchCsrfToken() {
                var _this2 = this;

                return this.get('/api/bootstrap/').then(function(res) {
                    _this2.csrfToken = res.csrf_token;
                });
            },
        },
        {
            key: '__responseFormatter',
            value: function __responseFormatter(res) {
                return res.data;
            },
        },
        {
            key: '__testUrl',
            value: function __testUrl(url) {
                if (!url.endsWith('/')) {
                    throw new Error(
                        'Binder does not accept urls that do not have a trailing slash: ' +
                            url
                    );
                }
            },
        },
        {
            key: 'get',
            value: function get$$1(url, data, options) {
                return this.__request('get', url, data, options);
            },
        },
        {
            key: 'post',
            value: function post(url, data, options) {
                return this.__request('post', url, data, options);
            },
        },
        {
            key: 'patch',
            value: function patch(url, data, options) {
                return this.__request('patch', url, data, options);
            },
        },
        {
            key: 'put',
            value: function put(url, data, options) {
                return this.__request('put', url, data, options);
            },
        },
        {
            key: 'delete',
            value: function _delete(url, data, options) {
                return this.__request('delete', url, data, options);
            },
        },
        {
            key: 'buildFetchModelParams',
            value: function buildFetchModelParams(model) {
                return {
                    // TODO: I really dislike that this is comma separated and not an array.
                    // We should fix this in the Binder API.
                    with:
                        model.__activeRelations
                            .map(model.constructor.toBackendAttrKey)
                            .join(',') || null,
                };
            },
        },
        {
            key: 'fetchModel',
            value: function fetchModel(_ref) {
                var url = _ref.url,
                    data = _ref.data,
                    requestOptions = _ref.requestOptions;

                return this.get(url, data, requestOptions).then(function(res) {
                    return {
                        data: res.data,
                        repos: res.with,
                        relMapping: res.with_mapping,
                    };
                });
            },
        },
        {
            key: 'saveModel',
            value: function saveModel(_ref2) {
                var url = _ref2.url,
                    data = _ref2.data,
                    isNew = _ref2.isNew,
                    requestOptions = _ref2.requestOptions;

                var method = isNew ? 'post' : 'patch';
                return this[method](url, data, requestOptions)
                    .then(function(newData) {
                        return { data: newData };
                    })
                    .catch(function(err) {
                        if (err.response) {
                            err.valErrors = parseBackendValidationErrors(
                                err.response
                            );
                        }
                        throw err;
                    });
            },
        },
        {
            key: 'saveAllModels',
            value: function saveAllModels(_ref3) {
                var url = _ref3.url,
                    data = _ref3.data,
                    model = _ref3.model,
                    requestOptions = _ref3.requestOptions;

                return this.put(
                    url,
                    {
                        data: data.data,
                        with: data.relations,
                    },
                    requestOptions
                )
                    .then(function(res) {
                        if (res.idmap) {
                            model.__parseNewIds(res.idmap);
                        }
                        return res;
                    })
                    .catch(function(err) {
                        if (err.response) {
                            err.valErrors = parseBackendValidationErrors(
                                err.response
                            );
                        }
                        throw err;
                    });
            },
        },
        {
            key: 'deleteModel',
            value: function deleteModel(_ref4) {
                var url = _ref4.url,
                    requestOptions = _ref4.requestOptions;

                // TODO: kind of silly now, but we'll probably want better error handling soon.
                return this.delete(url, null, requestOptions);
            },
        },
        {
            key: 'buildFetchStoreParams',
            value: function buildFetchStoreParams(store) {
                var offset = store.getPageOffset();
                return {
                    with:
                        store.__activeRelations
                            .map(store.Model.toBackendAttrKey)
                            .join(',') || null,
                    limit: store.__state.limit,
                    // Hide offset if zero so the request looks cleaner in DevTools.
                    offset: offset || null,
                };
            },
        },
        {
            key: 'fetchStore',
            value: function fetchStore(_ref5) {
                var url = _ref5.url,
                    data = _ref5.data,
                    requestOptions = _ref5.requestOptions;

                return this.get(url, data, requestOptions).then(function(res) {
                    return {
                        data: res.data,
                        repos: res.with,
                        relMapping: res.with_mapping,
                        totalRecords: res.meta.total_records,
                    };
                });
            },
        },
    ]);
    return BinderApi;
})();

function checkMomentInstance(attr, value) {
    invariant(
        moment.isMoment(value),
        'Attribute `' + attr + '` is not a moment instance.'
    );
}

var Casts = {
    date: {
        parse: function parse(attr, value) {
            if (value === null) {
                return null;
            }
            return moment(value, 'YYYY-MM-DD');
        },
        toJS: function toJS$$1(attr, value) {
            if (value === null) {
                return null;
            }
            checkMomentInstance(attr, value);
            return value.format('YYYY-MM-DD');
        },
    },
    datetime: {
        parse: function parse(attr, value) {
            if (value === null) {
                return null;
            }
            return moment(value);
        },
        toJS: function toJS$$1(attr, value) {
            if (value === null) {
                return null;
            }
            checkMomentInstance(attr, value);
            return value.format();
        },
    },
    enum: function _enum(expectedValues) {
        invariant(
            isArray(expectedValues),
            'Invalid argument suplied to `Casts.enum`, expected an instance of array.'
        );
        function checkExpectedValues(attr, value) {
            if (value === null) {
                return null;
            }
            if (expectedValues.includes(value)) {
                return value;
            }
            invariant(
                false,
                'Value set to attribute `' +
                    attr +
                    '`, ' +
                    JSON.stringify(value) +
                    ', is not one of the allowed enum: ' +
                    JSON.stringify(expectedValues)
            );
        }
        return {
            parse: checkExpectedValues,
            toJS: checkExpectedValues,
        };
    },
};

export { Model, Store, BinderApi, Casts };
