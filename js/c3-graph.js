﻿// Generated by IcedCoffeeScript 108.0.9
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  c3.Graph = (function(_super) {
    __extends(Graph, _super);

    function Graph() {
      return Graph.__super__.constructor.apply(this, arguments);
    }

    Graph.version = 0.1;

    Graph.prototype.type = 'graph';

    return Graph;

  })(c3.Chart);

  c3.Sankey = (function(_super) {
    __extends(Sankey, _super);

    function Sankey() {
      this._style = __bind(this._style, this);
      this._draw = __bind(this._draw, this);
      this._layout = __bind(this._layout, this);
      this._update = __bind(this._update, this);
      this._size = __bind(this._size, this);
      this._init = __bind(this._init, this);
      return Sankey.__super__.constructor.apply(this, arguments);
    }

    Sankey.version = 0.1;

    Sankey.prototype.type = 'sankey';

    Sankey.prototype.data = [];

    Sankey.prototype.links = [];

    Sankey.prototype.key = void 0;

    Sankey.prototype.value = void 0;

    Sankey.prototype.link_source = void 0;

    Sankey.prototype.link_target = void 0;

    Sankey.prototype.link_value = void 0;

    Sankey.prototype.iterations = 32;

    Sankey.prototype.alpha = 0.99;

    Sankey.prototype.node_padding = '20%';

    Sankey.prototype.node_width = 30;

    Sankey.prototype.align = 'both';

    Sankey.prototype.link_path = 'curve';

    Sankey.prototype.link_path_curvature = 0.5;

    Sankey.prototype.nodes_options = void 0;

    Sankey.prototype.node_options = void 0;

    Sankey.prototype.rect_options = void 0;

    Sankey.prototype.links_options = void 0;

    Sankey.prototype.link_options = void 0;

    Sankey.prototype.path_options = void 0;

    Sankey.prototype.node_label_options = void 0;

    Sankey.prototype.link_label_options = void 0;

    Sankey.prototype._init = function() {
      this.h = d3.scale.linear();
      this.v = d3.scale.linear();
      if (this.key == null) {
        this.key = (function(_this) {
          return function(d) {
            return _this.data.indexOf(d);
          };
        })(this);
      }
      if (this.link_key == null) {
        this.link_key = (function(_this) {
          return function(l) {
            return _this.link_source(l) + ',' + _this.link_target(l);
          };
        })(this);
      }
      if (this.link_source == null) {
        this.link_source = function(l) {
          return l.source;
        };
      }
      if (this.link_target == null) {
        this.link_target = function(l) {
          return l.target;
        };
      }
      return this.link_value != null ? this.link_value : this.link_value = function(l) {
        return l.value;
      };
    };

    Sankey.prototype._size = function() {
      this.v.range([0, this.height]);
      if (!isNaN(this.node_padding)) {
        return this._update();
      }
    };

    Sankey.prototype._update = function(origin) {
      var current_data, current_links, datum, detect_backedge, key, link, link_key, link_value, next_nodes, node, node_links, nodes, remaining_nodes, stack, target_key, visited, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _name, _name1, _ref, _ref1, _ref2, _ref3;
      if (origin === 'render' && !isNaN(this.node_padding)) {
        return;
      }
      this.nodes = nodes = {};
      this.node_links = node_links = {};
      current_links = [];
      _ref = this.links;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        link_key = this.link_key(link);
        link_value = this.link_value(link);
        if (!link_value) {
          continue;
        }
        if (node_links[link_key] != null) {
          throw Error("Link with duplicate source and target specified");
        }
        current_links.push(link);
        node_links[link_key] = {
          value: this.link_value(link)
        };
        node = nodes[_name = this.link_source(link)] != null ? nodes[_name] : nodes[_name] = {
          source_links: [],
          target_links: []
        };
        node.target_links.push(link);
        node = nodes[_name1 = this.link_target(link)] != null ? nodes[_name1] : nodes[_name1] = {
          source_links: [],
          target_links: []
        };
        node.source_links.push(link);
      }
      current_data = (function() {
        var _j, _len1, _ref1, _results;
        _ref1 = this.data;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          datum = _ref1[_j];
          if (this.key(datum) in this.nodes) {
            _results.push(datum);
          }
        }
        return _results;
      }).call(this);
      if (this.value != null) {
        for (_j = 0, _len1 = current_data.length; _j < _len1; _j++) {
          datum = current_data[_j];
          nodes[this.key(datum)].value = this.value(datum);
        }
      } else {
        key = this.key;
        link_key = this.link_key;
        for (_k = 0, _len2 = current_data.length; _k < _len2; _k++) {
          datum = current_data[_k];
          node = nodes[key(datum)];
          node.value = Math.max(d3.sum(node.source_links, function(l) {
            return node_links[link_key(l)].value;
          }), d3.sum(node.target_links, function(l) {
            return node_links[link_key(l)].value;
          }));
        }
      }
      for (key in nodes) {
        node = nodes[key];
        if (node.value == null) {
          throw Error("Missing nodes are not currently supported");
        }
      }
      visited = {};
      _ref1 = this.nodes;
      for (key in _ref1) {
        node = _ref1[key];
        if (!(!visited[key])) {
          continue;
        }
        stack = [];
        (detect_backedge = (function(_this) {
          return function(key, node) {
            var target, target_key, _l, _len3, _ref2;
            visited[key] = true;
            stack.push(node);
            _ref2 = node.target_links;
            for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
              link = _ref2[_l];
              target_key = _this.link_target(link);
              target = nodes[target_key];
              node_links[_this.link_key(link)].backedge = __indexOf.call(stack, target) >= 0;
              if (!visited[target_key]) {
                detect_backedge(target_key, target);
              }
            }
            return stack.pop();
          };
        })(this))(key, node);
      }
      remaining_nodes = this.nodes;
      x = 0;
      while (!c3.util.isEmpty(remaining_nodes)) {
        next_nodes = {};
        for (key in remaining_nodes) {
          node = remaining_nodes[key];
          node.x = x;
          _ref2 = node.target_links;
          for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
            link = _ref2[_l];
            if (!(!node_links[this.link_key(link)].backedge)) {
              continue;
            }
            target_key = this.link_target(link);
            next_nodes[target_key] = nodes[target_key];
          }
        }
        remaining_nodes = next_nodes;
        x++;
      }
      x--;
      if (this.align === 'both') {
        _ref3 = this.nodes;
        for (key in _ref3) {
          node = _ref3[key];
          if (!node.target_links.length) {
            node.x = x;
          }
        }
      }
      this.h.domain([0, x]);
      return this._layout(origin, current_data, current_links);
    };

    Sankey.prototype._layout = function(origin, current_data, current_links) {
      var alpha, collision_detection, column, columns, delta, i, iteration, j, key, layout_links, link, link_key, node, node_link, node_links, nodes, r, source_link_value, tmp, v_domain, weighted_y, y, _base, _i, _j, _k, _l, _len, _len1, _len10, _len11, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _s, _t, _u;
      nodes = this.nodes;
      node_links = this.node_links;
      this.columns = columns = d3.nest().key(function(node) {
        return node.x;
      }).sortKeys(d3.ascending).entries((function() {
        var _ref, _results;
        _ref = this.nodes;
        _results = [];
        for (key in _ref) {
          node = _ref[key];
          _results.push(node);
        }
        return _results;
      }).call(this)).map(function(g) {
        return g.values;
      });
      c3.array.sort_up(this.columns, function(column) {
        return column[0].x;
      });
      if (!isNaN(this.node_padding)) {
        for (_i = 0, _len = columns.length; _i < _len; _i++) {
          column = columns[_i];
          column.padding_percent = this.node_padding * (column.length - 1) / this.height;
          if (column.padding_percent > 0.8) {
            column.padding_percent = 0.8;
          }
        }
      } else if ((typeof (_base = this.node_padding).charAt === "function" ? _base.charAt(this.node_padding.length - 1) : void 0) === '%') {
        for (_j = 0, _len1 = columns.length; _j < _len1; _j++) {
          column = columns[_j];
          column.padding_percent = column.length === 1 ? 0 : this.node_padding.slice(0, -1) / 100;
          if (column.padding_percent === 1) {
            column.padding_percent = 0.999;
          }
        }
      } else {
        throw new Error("Unsupported node_padding parameter: " + this.node_padding);
      }
      v_domain = d3.max((function() {
        var _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = columns.length; _k < _len2; _k++) {
          column = columns[_k];
          _results.push(d3.sum(column, function(node) {
            return node.value;
          }) / (1 - column.padding_percent));
        }
        return _results;
      })());
      this.v.domain([0, v_domain]);
      for (_k = 0, _len2 = columns.length; _k < _len2; _k++) {
        column = columns[_k];
        column.padding = column.length === 1 ? 0 : v_domain * column.padding_percent / (column.length - 1);
      }
      collision_detection = (function(_this) {
        return function() {
          var dy, y, _l, _len3, _len4, _m, _results;
          _results = [];
          for (_l = 0, _len3 = columns.length; _l < _len3; _l++) {
            column = columns[_l];
            c3.array.sort_up(column, function(node) {
              return node.y;
            });
            y = 0;
            for (_m = 0, _len4 = column.length; _m < _len4; _m++) {
              node = column[_m];
              dy = y - node.y;
              if (dy > 0) {
                node.y += dy;
              }
              y = node.y + node.value + column.padding;
            }
            if (node.y + node.value > _this.v.domain()[1]) {
              y = _this.v.domain()[1];
              _results.push((function() {
                var _n, _results1;
                _results1 = [];
                for (_n = column.length - 1; _n >= 0; _n += -1) {
                  node = column[_n];
                  dy = node.y + node.value - y;
                  if (dy > 0) {
                    node.y -= dy;
                  } else {
                    break;
                  }
                  _results1.push(y = node.y - column.padding);
                }
                return _results1;
              })());
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        };
      })(this);
      layout_links = (function(_this) {
        return function() {
          var datum, link, link_key, link_source, link_target, node_link, y, _l, _len3, _len4, _m, _ref, _ref1, _results;
          link_key = _this.link_key;
          link_source = _this.link_source;
          link_target = _this.link_target;
          _ref = (function() {
            var _len3, _m, _results1;
            _results1 = [];
            for (_m = 0, _len3 = current_data.length; _m < _len3; _m++) {
              datum = current_data[_m];
              _results1.push(this.nodes[this.key(datum)]);
            }
            return _results1;
          }).call(_this);
          _results = [];
          for (_l = 0, _len3 = _ref.length; _l < _len3; _l++) {
            node = _ref[_l];
            c3.array.sort_up(node.source_links, function(link) {
              return nodes[link_source(link)].y;
            });
            y = node.y;
            _ref1 = node.source_links;
            for (_m = 0, _len4 = _ref1.length; _m < _len4; _m++) {
              link = _ref1[_m];
              node_link = node_links[link_key(link)];
              node_link.ty = y;
              y += node_link.value;
            }
            c3.array.sort_up(node.target_links, function(link) {
              return nodes[link_target(link)].y;
            });
            y = node.y;
            _results.push((function() {
              var _len5, _n, _ref2, _results1;
              _ref2 = node.target_links;
              _results1 = [];
              for (_n = 0, _len5 = _ref2.length; _n < _len5; _n++) {
                link = _ref2[_n];
                node_link = node_links[link_key(link)];
                node_link.sy = y;
                _results1.push(y += node_link.value);
              }
              return _results1;
            })());
          }
          return _results;
        };
      })(this);
      y = 0;
      if (columns.length) {
        c3.array.sort_up(columns[0], function(node) {
          return node.value;
        });
        tmp = columns[0].slice(0);
        _ref = d3.merge([
          (function() {
            var _m, _ref, _results;
            _results = [];
            for (i = _m = _ref = columns[0].length - 1; _m >= 0; i = _m += -2) {
              _results.push(i);
            }
            return _results;
          })(), (function() {
            var _m, _ref, _ref1, _results;
            _results = [];
            for (i = _m = _ref = columns[0].length % 2, _ref1 = columns[0].length - 1; _m <= _ref1; i = _m += 2) {
              _results.push(i);
            }
            return _results;
          })()
        ]);
        for (i = _l = 0, _len3 = _ref.length; _l < _len3; i = ++_l) {
          r = _ref[i];
          columns[0][i] = tmp[r];
        }
        _ref1 = columns[0];
        for (_m = 0, _len4 = _ref1.length; _m < _len4; _m++) {
          node = _ref1[_m];
          node.y = y;
          y += node.value + column.padding;
          if (isNaN(y)) {
            throw "BLARG";
          }
        }
      }
      for (j = _n = 0, _len5 = columns.length; _n < _len5; j = ++_n) {
        column = columns[j];
        if (j) {
          for (_o = 0, _len6 = column.length; _o < _len6; _o++) {
            node = column[_o];
            weighted_y = 0;
            source_link_value = 0;
            _ref2 = node.source_links;
            for (_p = 0, _len7 = _ref2.length; _p < _len7; _p++) {
              link = _ref2[_p];
              link_key = this.link_key(link);
              node_link = this.node_links[link_key];
              if (node_link.backedge) {
                continue;
              }
              weighted_y += nodes[this.link_source(link)].y * node_link.value;
              source_link_value += node_link.value;
            }
            node.y = weighted_y / source_link_value;
          }
        }
      }
      collision_detection();
      layout_links();
      alpha = 1;
      for (iteration = _q = 0, _ref3 = this.iterations; 0 <= _ref3 ? _q < _ref3 : _q > _ref3; iteration = 0 <= _ref3 ? ++_q : --_q) {
        alpha *= this.alpha;
        _ref4 = this.nodes;
        for (key in _ref4) {
          node = _ref4[key];
          node.links_sum = d3.sum(node.source_links, (function(_this) {
            return function(l) {
              return _this.node_links[_this.link_key(l)].value;
            };
          })(this)) + d3.sum(node.target_links, (function(_this) {
            return function(l) {
              return _this.node_links[_this.link_key(l)].value;
            };
          })(this));
        }
        for (_r = 0, _len8 = columns.length; _r < _len8; _r++) {
          column = columns[_r];
          for (_s = 0, _len9 = column.length; _s < _len9; _s++) {
            node = column[_s];
            delta = 0;
            _ref5 = node.source_links;
            for (_t = 0, _len10 = _ref5.length; _t < _len10; _t++) {
              link = _ref5[_t];
              node_link = this.node_links[this.link_key(link)];
              if (!node_link.backedge) {
                delta += (node_link.sy - node_link.ty) * node_link.value;
              }
            }
            _ref6 = node.target_links;
            for (_u = 0, _len11 = _ref6.length; _u < _len11; _u++) {
              link = _ref6[_u];
              node_link = this.node_links[this.link_key(link)];
              if (!node_link.backedge) {
                delta += (node_link.ty - node_link.sy) * node_link.value;
              }
            }
            delta /= node.links_sum;
            node.y += delta * alpha;
          }
        }
        collision_detection();
        layout_links();
      }
      this.nodes_layer = this.content.select('g.nodes').singleton().options(this.nodes_options).update();
      this.node_g = this.nodes_layer.select('g.node').options(this.node_options).animate(origin !== 'render').bind(current_data, this.key).update();
      this.rects = this.node_g.inherit('rect').options(this.rect_options).update();
      this.links_layer = this.content.select('g.links', ':first-child').singleton().options(this.links_options).update();
      this.link_g = this.links_layer.select('g.link').options(this.link_options).animate(origin !== 'render').bind(current_links, this.link_key).update();
      this.paths = this.link_g.inherit('path').options(this.path_options).update();
      return this.link_g.all.classed('backedge', (function(_this) {
        return function(link) {
          return _this.node_links[_this.link_key(link)].backedge;
        };
      })(this));
    };

    Sankey.prototype._draw = function(origin) {
      var node_percent, node_width, _base;
      if (!isNaN(this.node_width)) {
        node_width = this.node_width;
      } else if ((typeof (_base = this.node_width).charAt === "function" ? _base.charAt(this.node_width.length - 1) : void 0) === '%') {
        node_percent = this.node_width.slice(0, -1) / 100;
        node_width = (node_percent * this.width) / (this.columns.length + node_percent - 1);
      } else {
        throw new Error("Unsupported node_width parameter: " + this.node_width);
      }
      this.h.rangeRound([0, this.width - node_width]);
      this.rects.animate(origin !== 'render' && origin !== 'resize').position({
        x: (function(_this) {
          return function(d) {
            return _this.h(_this.nodes[_this.key(d)].x);
          };
        })(this),
        y: (function(_this) {
          return function(d) {
            return _this.v(_this.nodes[_this.key(d)].y);
          };
        })(this),
        width: node_width,
        height: (function(_this) {
          return function(d) {
            return Math.max(1, _this.v(_this.nodes[_this.key(d)].value));
          };
        })(this)
      });
      this.paths.animate(origin !== 'render' && origin !== 'resize').position({
        d: (function(_this) {
          return function(link) {
            var curvature, node_link, source_node, sx, sy, target_node, tx, ty, x_interpolator;
            node_link = _this.node_links[_this.link_key(link)];
            source_node = _this.nodes[_this.link_source(link)];
            target_node = _this.nodes[_this.link_target(link)];
            sx = _this.h(source_node.x) + node_width;
            tx = _this.h(target_node.x);
            switch (_this.link_path) {
              case 'straight':
                sy = _this.v(node_link.sy);
                ty = _this.v(node_link.ty);
                return 'M' + sx + ',' + sy + 'L' + tx + ',' + ty + 'l0,' + _this.v(node_link.value) + 'L' + sx + ',' + (sy + _this.v(node_link.value)) + 'Z';
              case 'curve':
                curvature = tx > sx ? _this.link_path_curvature : -_this.link_path_curvature * 4;
                sy = _this.v(node_link.sy + node_link.value / 2);
                ty = _this.v(node_link.ty + node_link.value / 2);
                x_interpolator = d3.interpolateRound(sx, tx);
                return 'M' + sx + ',' + sy + 'C' + x_interpolator(curvature) + ',' + sy + ' ' + x_interpolator(1 - curvature) + ',' + ty + ' ' + tx + ',' + ty;
              default:
                throw Error("Unknown link_path option: " + _this.link_path);
            }
          };
        })(this),
        'stroke-width': this.link_path === 'curve' ? (function(_this) {
          return function(link) {
            return Math.max(1, _this.v(_this.node_links[_this.link_key(link)].value));
          };
        })(this) : void 0
      });
      return this.links_layer.all.attr('class', 'links ' + this.link_path);
    };

    Sankey.prototype._style = function(style_new) {
      this.node_g.options(this.node_options);
      this.rects.options(this.rect_options);
      this.link_g.options(this.link_options);
      this.paths.options(this.path_options);
      this.nodes_layer.style();
      this.node_g.style(style_new);
      this.rects.style(style_new);
      this.links_layer.style();
      this.link_g.style(style_new);
      return this.paths.style(style_new);
    };

    return Sankey;

  })(c3.Graph);

  c3.Butterfly = (function(_super) {
    __extends(Butterfly, _super);

    function Butterfly() {
      this.focus = __bind(this.focus, this);
      this._style = __bind(this._style, this);
      this._butterfly_update = __bind(this._butterfly_update, this);
      this._update = __bind(this._update, this);
      return Butterfly.__super__.constructor.apply(this, arguments);
    }

    Butterfly.version = 0.1;

    Butterfly.prototype.type = 'butterfly';

    Butterfly.prototype.navigatable = true;

    Butterfly.prototype.depth_of_field = 2;

    Butterfly.prototype._update = function(origin) {
      Butterfly.__super__._update.apply(this, arguments);
      return this._butterfly_update();
    };

    Butterfly.prototype._butterfly_update = function() {
      if (this.navigatable) {
        return this.rects["new"].on('click', (function(_this) {
          return function(datum) {
            return _this.focus(datum);
          };
        })(this));
      }
    };

    Butterfly.prototype._style = function(style_new) {
      Butterfly.__super__._style.apply(this, arguments);
      return this.content.all.classed('navigatable', this.navigatable);
    };

    Butterfly.prototype.focus = function(focus) {
      var current_data, current_links, datum, focus_key, focus_node, nodes, walk;
      console.debug(focus);
      focus_key = this.key(focus);
      focus_node = this.nodes[focus_key];
      nodes = {};
      nodes[focus_key] = focus_node;
      current_links = [];
      walk = (function(_this) {
        return function(key, direction, depth) {
          var link, links, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
          node = nodes[key] = _this.nodes[key];
          node.x = _this.depth_of_field + (depth * direction);
          _ref = [node.source_links, node.target_links];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            links = _ref[_i];
            for (_j = 0, _len1 = links.length; _j < _len1; _j++) {
              link = links[_j];
              current_links.push(link);
            }
          }
          if (depth < _this.depth_of_field) {
            _ref1 = (direction === 1 ? node.target_links : node.source_links);
            _results = [];
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
              link = _ref1[_k];
              _results.push(walk((direction === 1 ? _this.link_target : _this.link_source)(link), direction, depth + 1));
            }
            return _results;
          }
        };
      })(this);
      walk(focus_key, 1, 0);
      walk(focus_key, -1, 0);
      current_data = (function() {
        var _i, _len, _ref, _results;
        _ref = this.data;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          datum = _ref[_i];
          if (this.key(datum) in nodes) {
            _results.push(datum);
          }
        }
        return _results;
      }).call(this);
      this.h.domain([0, this.depth_of_field * 2]);
      this._layout('focus', current_data, current_links);
      this._butterfly_update();
      this._draw('focus');
      return this._style(true);
    };

    return Butterfly;

  })(c3.Sankey);

}).call(this);