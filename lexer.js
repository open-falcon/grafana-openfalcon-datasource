///<reference path="../../../headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    function Lexer(expression) {
        this.input = expression;
    }
    exports_1("Lexer", Lexer);
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            Lexer.prototype = {
                tokenize: function () {
                    var list = [];
                    var pos = 0;
                    var split_list = this.input.split("#");
                    var length = split_list.length;
                    split_list.map(function(entry, index){
                        list.push({
                            type: "identifier",
                            value: entry,
                            pos: pos + 1
                        });
                        pos += entry.length;
                        if (index < length - 1) {
                            list.push({
                                type: '#',
                                value: '#',
                                pos: pos + 1
                            })
                            pos += 1;
                        }
                    });
                    return list;
                }
            };
        }
    }
});
//# sourceMappingURL=lexer.js.map
