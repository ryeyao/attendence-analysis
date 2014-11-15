/**
 * Created by rye on 11/14/14.
 */

exports.get_property = function (val, def_val) {

    if (_is_undefined(val)) {
        return def_val;
    }

    return val;
}

/**
 *
 * Update all vals that also occur in def_vals
 *
 * @param vals is dict.
 * @param def_vals is dict.
 * @param callback is optional.
 */
exports.set_properties = function (vals, def_vals, options, callback) {

    if (_is_undefined(options)) {
        options = {
            extend : false,
            force_update : false,
            swap   : false
        };
        callback = _default_callback;
    }

    if (_is_undefined(callback)) {
        callback = _default_callback;
    }

    if (_is_undefined(vals)) {
        callback(-1, 'vals must be set.');
        return;
    }

    if (_is_undefined(def_vals)) {
        def_vals = {};
    }

    if (!_is_object(vals)) {
        callback(-1, 'vals must be object');
        return;
    }

    if (!_is_object(def_vals)) {
        callback(-1, 'def_vals must be object');
        return;
    }

    if (options.swap) {
        for (var k in vals) {
            delete vals[k];
        }

        for (var k in def_vals) {
            vals[k] = def_vals[k];
        }

        return;
    }

    if (options.extend) {
        for (var k in def_vals) {
            if (options.force_update) {
                vals[k] = def_vals[k];
            } else {
                vals[k] = this.get_property(vals[k], def_vals[k]);
            }
        }
    } else {
        if (options.force_update) {
            for (var k in vals) {
                vals[k] = this.get_property(def_vals[k], vals[k]);
            }
        }
        else {
            callback(-1, 'No extend nor force_update. Nothing happened');
            return;
        }
    }

    callback(0);
    return;
}

function _default_callback (err, msg) {
    if (err) {
        console.log(msg);
    }
}

function _is_undefined (o) {
    return typeof o === 'undefined';
}

function _is_object (o) {
    return typeof o === 'object';
}
