///<reference path="../../../headers/common.d.ts" />
System.register(['./add_openfalcon_func', './func_editor', 'lodash', './gfunc', './parser', 'app/plugins/sdk'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var lodash_1, gfunc_1, parser_1, sdk_1;
    var OpenfalconQueryCtrl;
    return {
        setters:[
            function (_1) {},
            function (_2) {},
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (gfunc_1_1) {
                gfunc_1 = gfunc_1_1;
            },
            function (parser_1_1) {
                parser_1 = parser_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            }],
        execute: function() {
            OpenfalconQueryCtrl = (function (_super) {
                __extends(OpenfalconQueryCtrl, _super);
                /** @ngInject **/
                function OpenfalconQueryCtrl($scope, $injector, uiSegmentSrv, templateSrv) {
                    _super.call(this, $scope, $injector);
                    this.uiSegmentSrv = uiSegmentSrv;
                    this.templateSrv = templateSrv;
                    if (this.target) {
                        this.target.target = this.target.target || '';
                        this.parseTarget();
                    }
                }
                OpenfalconQueryCtrl.prototype.toggleEditorMode = function () {
                    this.target.textEditor = !this.target.textEditor;
                    this.parseTarget();
                };
                OpenfalconQueryCtrl.prototype.parseTarget = function () {
                    this.functions = [];
                    this.segments = [];
                    this.error = null;
                    if (this.target.textEditor) {
                        //fix "." back to "#"
                        //this.target.target = this.target.target.replace(/\./g, "#");
                        //fix ip back to the right foramt ex. 10#10#10#10 -> 10.10.10.10
                        //this.target.target = this.target.target.replace(/(\d+)#(\d+)#(\d+)#(\d+)/g,"$1.$2.$3.$4");
                        return;
                    }else{
                        //fix "." to "#"
                        //this.target.target =  this.target.target.replace(/#/g, ".");
                    }
                    var parser = new parser_1.Parser(this.target.target);
                    var astNode = parser.getAst();
                    if (astNode === null) {
                        this.checkOtherSegments(0);
                        return;
                    }
                    if (astNode.type === 'error') {
                        this.error = astNode.message + " at position: " + astNode.pos;
                        this.target.textEditor = true;
                        return;
                    }
                    try {
                        this.parseTargeRecursive(astNode, null, 0);
                    }
                    catch (err) {
                        console.log('error parsing target:', err.message);
                        this.error = err.message;
                        this.target.textEditor = true;
                    }
                    this.checkOtherSegments(this.segments.length - 1);
                };
                OpenfalconQueryCtrl.prototype.addFunctionParameter = function (func, value, index, shiftBack) {
                    if (shiftBack) {
                        index = Math.max(index - 1, 0);
                    }
                    func.params[index] = value;
                };
                OpenfalconQueryCtrl.prototype.parseTargeRecursive = function (astNode, func, index) {
                    var _this = this;
                    if (astNode === null) {
                        return null;
                    }
                    switch (astNode.type) {
                        case 'function':
                            var innerFunc = gfunc_1.default.createFuncInstance(astNode.name, { withDefaultParams: false });
                            lodash_1.default.each(astNode.params, function (param, index) {
                                _this.parseTargeRecursive(param, innerFunc, index);
                            });
                            innerFunc.updateText();
                            this.functions.push(innerFunc);
                            break;
                        case 'series-ref':
                            this.addFunctionParameter(func, astNode.value, index, this.segments.length > 0);
                            break;
                        case 'bool':
                        case 'string':
                        case 'number':
                            if ((index - 1) >= func.def.params.length) {
                                throw { message: 'invalid number of parameters to method ' + func.def.name };
                            }
                            this.addFunctionParameter(func, astNode.value, index, true);
                            break;
                        case 'metric':
                            if (this.segments.length > 0) {
                                if (astNode.segments.length !== 1) {
                                    throw { message: 'Multiple metric params not supported, use text editor.' };
                                }
                                this.addFunctionParameter(func, astNode.segments[0].value, index, true);
                                break;
                            }
                            this.segments = lodash_1.default.map(astNode.segments, function (segment) {
                                return _this.uiSegmentSrv.newSegment(segment);
                            });
                    }
                };
                OpenfalconQueryCtrl.prototype.getSegmentPathUpTo = function (index) {
                    var arr = this.segments.slice(0, index);
                    return lodash_1.default.reduce(arr, function (result, segment) {
                        return result ? (result + "#" + segment.value) : segment.value;
                    }, "");
                };
                OpenfalconQueryCtrl.prototype.checkOtherSegments = function (fromIndex) {
                    var _this = this;
                    if (fromIndex === 0) {
                        this.segments.push(this.uiSegmentSrv.newSelectMetric());
                        return;
                    }
                    var path = this.getSegmentPathUpTo(fromIndex + 1);
                    return this.datasource.metricFindQuery(path).then(function (segments) {
                        if (segments.length === 0) {
                            if (path !== '') {
                                _this.segments = _this.segments.splice(0, fromIndex);
                                _this.segments.push(_this.uiSegmentSrv.newSelectMetric());
                            }
                        }
                        else if (segments[0].expandable || segments.length > 1) {
                            if (_this.segments.length === fromIndex) {
                                _this.segments.push(_this.uiSegmentSrv.newSelectMetric());
                            }
                            else {
                                return _this.checkOtherSegments(fromIndex + 1);
                            }
                        }
                    }).catch(function (err) {
                        _this.error = err.message || 'Failed to issue metric query';
                    });
                };
                OpenfalconQueryCtrl.prototype.setSegmentFocus = function (segmentIndex) {
                    lodash_1.default.each(this.segments, function (segment, index) {
                        segment.focus = segmentIndex === index;
                    });
                };
                OpenfalconQueryCtrl.prototype.wrapFunction = function (target, func) {
                    return func.render(target);
                };
                OpenfalconQueryCtrl.prototype.getAltSegments = function (index) {
                    var _this = this;
                    var query = "";
                    if(index === 0){
                      query = this.getSegmentPathUpTo(index) || ".*";
                    }else{
                      query = this.getSegmentPathUpTo(index) + '#.*';
                    }

                    return this.datasource.metricFindQuery(query).then(function (segments) {
                        var altSegments = lodash_1.default.map(segments, function (segment) {
                            return _this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                        });
                        if (altSegments.length === 0) { return altSegments; }
                        // add template variables
                        lodash_1.default.each(_this.templateSrv.variables, function (variable) {
                            altSegments.unshift(_this.uiSegmentSrv.newSegment({
                                type: 'template',
                                value: '$' + variable.name,
                                expandable: true,
                            }));
                        });
                        // add wildcard option
                        altSegments.unshift(_this.uiSegmentSrv.newSegment('*'));
                        return altSegments;
                    }).catch(function (err) {
                        _this.error = err.message || 'Failed to issue metric query';
                        return [];
                    });
                };
                OpenfalconQueryCtrl.prototype.segmentValueChanged = function (segment, segmentIndex) {
                    var _this = this;
                    this.error = null;
                    if (this.functions.length > 0 && this.functions[0].def.fake) {
                        this.functions = [];
                    }
                    if (segment.expandable) {
                        return this.checkOtherSegments(segmentIndex + 1).then(function () {
                            _this.setSegmentFocus(segmentIndex + 1);
                            _this.targetChanged();
                        });
                    }
                    else {
                        this.segments = this.segments.splice(0, segmentIndex + 1);
                    }
                    this.setSegmentFocus(segmentIndex + 1);
                    this.targetChanged();
                };
                OpenfalconQueryCtrl.prototype.targetTextChanged = function () {
                    this.parseTarget();
                    this.panelCtrl.refresh();
                };
                OpenfalconQueryCtrl.prototype.targetChanged = function () {
                    if (this.error) {
                        return;
                    }
                    var oldTarget = this.target.target;
                    var target = this.getSegmentPathUpTo(this.segments.length);
                    this.target.target = lodash_1.default.reduce(this.functions, this.wrapFunction, target);
                    if (this.target.target !== oldTarget) {
                        if (this.segments[this.segments.length - 1].value !== 'select metric') {
                            this.panelCtrl.refresh();
                        }
                    }
                };
                OpenfalconQueryCtrl.prototype.removeFunction = function (func) {
                    this.functions = lodash_1.default.without(this.functions, func);
                    this.targetChanged();
                };
                OpenfalconQueryCtrl.prototype.addFunction = function (funcDef) {
                    var newFunc = gfunc_1.default.createFuncInstance(funcDef, { withDefaultParams: true });
                    newFunc.added = true;
                    this.functions.push(newFunc);
                    this.moveAliasFuncLast();
                    this.smartlyHandleNewAliasByNode(newFunc);
                    if (this.segments.length === 1 && this.segments[0].fake) {
                        this.segments = [];
                    }
                    if (!newFunc.params.length && newFunc.added) {
                        this.targetChanged();
                    }
                };
                OpenfalconQueryCtrl.prototype.moveAliasFuncLast = function () {
                    var aliasFunc = lodash_1.default.find(this.functions, function (func) {
                        return func.def.name === 'alias' ||
                            func.def.name === 'aliasByNode' ||
                            func.def.name === 'aliasByMetric';
                    });
                    if (aliasFunc) {
                        this.functions = lodash_1.default.without(this.functions, aliasFunc);
                        this.functions.push(aliasFunc);
                    }
                };
                OpenfalconQueryCtrl.prototype.smartlyHandleNewAliasByNode = function (func) {
                    if (func.def.name !== 'aliasByNode') {
                        return;
                    }
                    for (var i = 0; i < this.segments.length; i++) {
                        if (this.segments[i].value.indexOf('*') >= 0) {
                            func.params[0] = i;
                            func.added = false;
                            this.targetChanged();
                            return;
                        }
                    }
                };
                OpenfalconQueryCtrl.templateUrl = 'partials/query.editor.html';
                return OpenfalconQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("OpenfalconQueryCtrl", OpenfalconQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map
