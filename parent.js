var a = function() {

    var that = {};
    var my = {};

    my.data = "Test string";

    that.sayHello = function() {
        console.log("Hello");
    }

    that.talkToB = function() {
        my.b.sayHello();
        my.b.readA();
    }

    var b = function() {

        var that = {};

        that.sayHello = function() {
            console.log("Hello from B");
        }

        that.readA = function() {
            console.log(my.data);
        }

        return that;
    }

    my.b = b();

    return that;
}

var test = a();
test.sayHello();
test.talkToB();

console.log("Waddup");
