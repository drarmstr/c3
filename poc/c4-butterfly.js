(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  c4.chart.butterfly = (function(_super) {
    __extends(butterfly, _super);

    butterfly.version = 0.0;

    butterfly.prototype.node_padding_percent = 1;

    butterfly.prototype.link_path = 'line';

    butterfly.prototype.link_path_curvature = 0.25;

    butterfly.prototype.animate = true;

    butterfly.prototype.duration = 1000;

    function butterfly() {
      this._style = __bind(this._style, this);
      this._draw = __bind(this._draw, this);
      this._update = __bind(this._update, this);
      this._size = __bind(this._size, this);
      this._init = __bind(this._init, this);
      butterfly.__super__.constructor.apply(this, arguments);
      this.h = d3.scale.linear().domain([-2, 2]);
      this.v = d3.scale.linear();
    }

    butterfly.prototype._init = function() {
      this.g.append('g').attr('class', 'links');
      this.g.append('g').attr('class', 'treasure_links');
      this.g.append('g').attr('class', 'nodes');
      this.g.append('g').attr('class', 'column_labels');
      this.zoomer = d3.behavior.zoom().scaleExtent([0.25, 10]).on('zoom', (function(_this) {
        return function() {
          return _this.g.attr('transform', "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };
      })(this));
      this.zoomer(this.svg);
      return this.svg.on('dblclick.zoom', null);
    };

    butterfly.prototype._size = function() {
      this.h.rangeRound([0, this.width]);
      return this.v.range([0, this.height]);
    };

    butterfly.prototype._update = function() {
      var center_nodes, column, link, node, source_nodes, target_nodes, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _results;
      if (this.center_node == null) {
        return this.columns = [];
      } else {
        target_nodes = [];
        source_nodes = [];
        center_nodes = [this.center_node];
        source_nodes.col = -1;
        center_nodes.col = 0;
        target_nodes.col = 1;
        source_nodes.label = this.source_label;
        target_nodes.label = this.target_label;
        this.columns = [center_nodes, target_nodes, source_nodes];
        this.center_node.value = this.node_value(this.center_node);
        if (this.center_node.target_links != null) {
          _ref = this.center_node.target_links;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            link = _ref[_i];
            if (link.target.value = this.node_value(link.target)) {
              target_nodes.push(link.target);
            }
          }
        }
        if (this.center_node.source_links != null) {
          _ref1 = this.center_node.source_links;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            link = _ref1[_j];
            if (link.source.value = this.node_value(link.source)) {
              source_nodes.push(link.source);
            }
          }
        }
        for (_k = 0, _len2 = target_nodes.length; _k < _len2; _k++) {
          node = target_nodes[_k];
          if (__indexOf.call(source_nodes, node) >= 0) {
            center_nodes.push(node);
          }
        }
        _ref2 = this.columns;
        for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
          column = _ref2[_l];
          column.sum = d3.sum((function() {
            var _len4, _m, _results;
            _results = [];
            for (_m = 0, _len4 = column.length; _m < _len4; _m++) {
              node = column[_m];
              _results.push(node.value);
            }
            return _results;
          })());
          column.total_space = (1 + this.node_padding_percent) * column.sum;
        }
        this.v.domain([
          0, d3.max((function() {
            var _len4, _m, _ref3, _results;
            _ref3 = this.columns;
            _results = [];
            for (_m = 0, _len4 = _ref3.length; _m < _len4; _m++) {
              column = _ref3[_m];
              _results.push(column.total_space);
            }
            return _results;
          }).call(this))
        ]);
        _ref3 = this.columns;
        _results = [];
        for (_m = 0, _len4 = _ref3.length; _m < _len4; _m++) {
          column = _ref3[_m];
          if (column.total_space < this.v.domain()[1]) {
            column.total_space += (this.v.domain()[1] - column.total_space) / 2;
          }
          _results.push(column.pad = (column.total_space - column.sum) / (column.length + 1));
        }
        return _results;
      }
    };

    butterfly.prototype._draw = function(origin) {
      var column, column_labels, cummulative_link, cummulative_trail_y, cummulative_y, event, handler, link, node, node_width_half, pad_x, pad_y, paths_render, trail_total_y, trailing_pad_y, treasure_link, treasure_links, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      this.current_nodes = [];
      this.current_links = [];
      node_width_half = (this.node_width / 2) | 0;
      _ref = this.columns;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        column = _ref[_i];
        pad_y = this.v(column.pad);
        cummulative_y = (this.v.range()[1] - this.v(column.total_space)) / 2 + pad_y;
        for (_j = 0, _len1 = column.length; _j < _len1; _j++) {
          node = column[_j];
          if (!(__indexOf.call(this.current_nodes, node) < 0)) {
            continue;
          }
          node.butterfly_column = column.col;
          node.x = this.h(column.col) - node_width_half;
          node.y = cummulative_y;
          node.dy = this.v(node.value);
          cummulative_y += node.dy + pad_y;
          this.current_nodes.push(node);
        }
      }
      pad_x = this.h(1) - this.h(0);
      _ref1 = this.columns;
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        column = _ref1[_k];
        for (_l = 0, _len3 = column.length; _l < _len3; _l++) {
          node = column[_l];
          trail_total_y = node.dy * this.node_padding_percent + this.v(column.pad) / 2;
          if (node.target_links != null) {
            trailing_pad_y = trail_total_y / (node.target_links.length - 1);
            cummulative_trail_y = node.y - trail_total_y / 2;
            cummulative_link = node.y;
            _ref2 = node.target_links;
            for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
              link = _ref2[_m];
              link.sy = cummulative_link;
              link.dy = this.v(this.link_value(link));
              cummulative_link += link.dy;
              link.sx = node.x + this.node_width;
              if (_ref3 = link.target, __indexOf.call(this.current_nodes, _ref3) < 0) {
                link.tx = node.x + this.node_width + pad_x / (node.butterfly_column < 1 ? 2 : 1);
                link.ty = cummulative_trail_y;
              }
              cummulative_trail_y += link.dy + trailing_pad_y;
              if (__indexOf.call(this.current_links, link) < 0) {
                this.current_links.push(link);
              }
            }
          }
          if (node.source_links != null) {
            trailing_pad_y = trail_total_y / (node.source_links.length - 1);
            cummulative_trail_y = node.y - trail_total_y / 2;
            cummulative_link = node.y;
            _ref4 = node.source_links;
            for (_n = 0, _len5 = _ref4.length; _n < _len5; _n++) {
              link = _ref4[_n];
              link.ty = cummulative_link;
              link.dy = this.v(this.link_value(link));
              cummulative_link += link.dy;
              link.tx = node.x;
              if (_ref5 = link.source, __indexOf.call(this.current_nodes, _ref5) < 0) {
                link.sx = node.x - pad_x / (node.butterfly_column > -1 ? 2 : 1);
                link.sy = cummulative_trail_y;
              }
              cummulative_trail_y += link.dy + trailing_pad_y;
              if (__indexOf.call(this.current_links, link) < 0) {
                this.current_links.push(link);
              }
            }
          }
        }
      }
      _ref6 = this.current_links;
      for (_o = 0, _len6 = _ref6.length; _o < _len6; _o++) {
        link = _ref6[_o];
        if (link.dy > link.tx - link.sx) {
          if (_ref7 = link.target, __indexOf.call(this.current_nodes, _ref7) < 0) {
            link.tx += link.dy - (link.tx - link.sx);
          } else if (_ref8 = link.source, __indexOf.call(this.current_nodes, _ref8) < 0) {
            link.sx -= link.dy - (link.tx - link.sx);
          }
        }
        if (link.sy.toFixed(3) === link.ty.toFixed(3)) {
          if ((_ref9 = link.target, __indexOf.call(this.current_nodes, _ref9) < 0) || (_ref10 = link.source, __indexOf.call(this.current_nodes, _ref10) < 0)) {
            link.sy += 0.001;
          }
        }
      }
      _ref11 = this.current_links;
      for (_p = 0, _len7 = _ref11.length; _p < _len7; _p++) {
        link = _ref11[_p];
        _ref12 = this.treasure_links;
        for (_q = 0, _len8 = _ref12.length; _q < _len8; _q++) {
          treasure_link = _ref12[_q];
          if (!(link.source === treasure_link.source && link.target === treasure_link.target)) {
            continue;
          }
          treasure_link.sx = link.sx;
          treasure_link.tx = link.tx;
          treasure_link.sy = link.sy;
          treasure_link.ty = link.ty;
          treasure_link.dy = this.v(this.link_value(treasure_link));
          this.current_links.push(treasure_link);
        }
      }
      this.nodes = this.g.select('g.nodes').selectAll('g').data(this.current_nodes, this.node_key);
      this.paths = this.g.select('g.links').selectAll('path').data(this.current_links, this.link_key);
      column_labels = this.g.select('g.column_labels').selectAll('text.column_labels').data(this.columns);
      this.new_nodes = this.nodes.enter().append('g');
      this.nodes.exit().remove();
      this.new_rects = this.new_nodes.append('rect').attr('width', this.node_width);
      this.rects = this.nodes.selectAll('rect');
      if (this.node_title != null) {
        this.new_rects.append('title');
        this.rects.selectAll('title').text(this.node_title);
      }
      if (this.node_label != null) {
        this.new_labels = this.new_nodes.append('text').text(this.node_label).style('dominant-baseline', 'middle');
        this.labels = this.nodes.selectAll('text');
      }
      if (this.node_on != null) {
        _ref13 = this.node_on;
        for (event in _ref13) {
          handler = _ref13[event];
          this.new_nodes.on(event, handler);
        }
      }
      this.new_paths = this.paths.enter().insert('path');
      this.paths.exit().remove();
      if (this.link_title != null) {
        this.new_paths.append('title');
        this.paths.selectAll('title').text(this.link_title);
      }
      if (this.link_on != null) {
        _ref14 = this.link_on;
        for (event in _ref14) {
          handler = _ref14[event];
          this.new_paths.on(event, handler);
        }
      }
      treasure_links = this.treasure_links;
      this.paths.each(function(l) {
        if (__indexOf.call(treasure_links, l) >= 0) {
          return this.parentNode.appendChild(this);
        }
      });
      column_labels.enter().append('text').attr('class', 'column_labels').style('text-anchor', 'middle').style('dominant-baseline', 'middle');
      if (this.animate) {
        this.new_nodes.attr('transform', (function(_this) {
          return function(n) {
            return "translate(" + (n.x > _this.h(0) ? _this.width : n.x < _this.h(0) - node_width_half ? -_this.node_width : n.x) + "," + n.y + ")";
          };
        })(this)).style('opacity', 0);
        this.new_rects.attr('height', function(n) {
          return n.dy;
        });
        if ((_ref15 = this.new_labels) != null) {
          _ref15.attr('transform', function(n) {
            return "translate(5," + (n.dy / 2) + ")";
          });
        }
      }
      (this.animate ? this.nodes.transition().duration(this.duration) : this.nodes).attr('transform', function(n) {
        return "translate(" + n.x + "," + n.y + ")";
      }).style('opacity', 1);
      (this.animate ? this.rects.transition().duration(this.duration) : this.rects).attr('height', function(n) {
        return n.dy;
      });
      (this.animate ? this.labels.transition().duration(this.duration) : this.labels).attr('transform', function(n) {
        return "translate(5," + (n.dy / 2) + ")";
      });
      paths_render = (function(_this) {
        return function(paths) {
          switch (_this.link_path) {
            case 'line':
              paths.style('opacity', 1);
              return paths.attr('d', function(l) {
                return "M" + l.sx + ',' + l.sy + "L" + l.tx + ',' + l.ty + "L" + l.tx + ',' + (l.ty + l.dy) + "L" + l.sx + ',' + (l.sy + l.dy) + "Z";
              });
            case 'curve':
              paths.style('opacity', 1);
              paths.style('stroke-width', function(l) {
                return Math.max(1, l.dy);
              });
              return paths.attr('d', function(l) {
                var curvature, x0_cp, x1_cp, xi, y0, y1;
                curvature = l.tx > l.sx ? _this.link_path_curvature : -_this.link_path_curvature * 8;
                y0 = l.sy + l.dy / 2;
                y1 = l.ty + l.dy / 2;
                xi = d3.interpolateRound(l.sx, l.tx);
                x0_cp = xi(curvature);
                x1_cp = xi(1 - curvature);
                return "M" + l.sx + ',' + y0 + "C" + x0_cp + ',' + y0 + " " + x1_cp + ',' + y1 + " " + l.tx + ',' + y1;
              });
          }
        };
      })(this);
      if (this.animate) {
        paths_render(this.new_paths);
        this.new_paths.style('opacity', 0);
      }
      paths_render((this.animate ? this.paths.transition().duration(this.duration) : this.paths));
      (this.animate ? column_labels.transition().duration(this.duration) : column_labels).attr('x', (function(_this) {
        return function(column) {
          return _this.h(column.col);
        };
      })(this)).attr('y', (function(_this) {
        return function(column) {
          return _this.v(_this.v.domain()[1] - column.total_space + column.pad) / 2;
        };
      })(this)).text(function(column) {
        if (column.length) {
          return column.label;
        }
      });
      return this.nodes.on('click', (function(_this) {
        return function(n) {
          return _this.trigger('click', n);
        };
      })(this));
    };

    butterfly.prototype._style = function(style_new) {
      var k, paths, rects, v, _ref, _ref1;
      rects = style_new ? this.new_rects : this.rects;
      if (this.node_class != null) {
        rects.attr('class', this.node_class);
      }
      if (this.node_classes != null) {
        _ref = this.node_classes;
        for (k in _ref) {
          v = _ref[k];
          rects.classed(k, v);
        }
      }
      if (this.node_color != null) {
        rects.style('fill', this.node_color);
      }
      if (this.node_styles != null) {
        rects.style(this.node_styles);
      }
      paths = style_new ? this.new_paths : this.paths;
      if (this.link_styles != null) {
        paths.style(this.link_styles);
      }
      if (this.link_class != null) {
        paths.attr('class', this.link_class);
      }
      this.paths.classed('treasure', (function(_this) {
        return function(l) {
          return __indexOf.call(_this.treasure_links, l) >= 0;
        };
      })(this));
      if (this.link_classes != null) {
        _ref1 = this.link_classes;
        for (k in _ref1) {
          v = _ref1[k];
          paths.classed(k, v);
        }
      }
      return this.paths.attr('mask', (function(_this) {
        return function(l) {
          var _ref2, _ref3;
          if (_ref2 = l.source, __indexOf.call(_this.current_nodes, _ref2) < 0) {
            return 'url(#mask_fade_left)';
          } else if (_ref3 = l.target, __indexOf.call(_this.current_nodes, _ref3) < 0) {
            return 'url(#mask_fade_right)';
          } else {
            return null;
          }
        };
      })(this));
    };

    return butterfly;

  })(c4.chart);

}).call(this);

//# sourceMappingURL=c4-butterfly.js.map
