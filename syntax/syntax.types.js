
 definition of types
======================

a
// Variable declaration　error, variable has to be initialized.


a = None
// var a = null;


a = 1
// var a = 1;


a = "aa"
// var a = "aa";


a = NaN
// var a = NaN;


a = Infinity
// var a = Infinity;


a = true
// var a = true;


a = false
// var a = false;


/* unimplemented */
a = 1
b = "{a} + 1 = 2"
// var a = 1;
// var b = "1 + 1 = 2";


/* unimplemented */
a = 1
b = '{a} + 1 = 2'
// var a = 1;
// var b = '1 + 1 = 2';


a = []
// var a = [];


a = [1, 2]
// var a = [1, 2];


a = {}
// var a = {};


a = {"a":1, "b":2}
// var a = {"a":1, "b":2};


a = {}
a['b'] = 1
// var a = {}
// a['b'] = 1


a = {1, 2}
// error


a = {}
a.b = 1
// error