var units = {
    't': 'C',
    'p': 'hPa',
    'w': 'km/h',
    'pp': 'mm'
};

var conversion = {
    // From ºF
    't': {
        'C': function(f) { return (f-32)*5/9; }
    },
    // From Hg
    'p': {
        'hPa': function(h) { return h*33.8638816; }
    },
    // From mph
    'w': {
        'km/h': function(w) { return w*1.609344; }
    },
    // rain clicks (0.2 mm per click)
    'pp': {
        'mm': function(pp) { return pp*0.2; }
    }
};

exports.convert = function(t, v) {
    return conversion[t][units[t]](v);
};