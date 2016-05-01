(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  c4.chart.graph = (function(_super) {
    __extends(graph, _super);

    function graph() {
      this.unfreeze = __bind(this.unfreeze, this);
      this.freeze = __bind(this.freeze, this);
      this._style = __bind(this._style, this);
      this._draw = __bind(this._draw, this);
      this._update = __bind(this._update, this);
      this.reset = __bind(this.reset, this);
      this._size = __bind(this._size, this);
      this._init = __bind(this._init, this);
      return graph.__super__.constructor.apply(this, arguments);
    }

    graph.version = 0.0;

    graph.prototype.collision_separation = 0;

    graph.prototype.arrow_size = 8;

    graph.prototype.node_on = void 0;

    graph.prototype._init = function() {
      var quadtree;
      quadtree = d3.geom.quadtree().x(function(d) {
        return d.x;
      }).y(function(d) {
        return d.y;
      });
      this.force = d3.layout.force().gravity(0.2).on('tick', (function(_this) {
        return function() {
          var bounds, node, _i, _len, _ref;
          if (_this.collision_detection) {
            _ref = _this.current_nodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              node = _ref[_i];
              bounds = node.r + _this.collision_separation / 2;
              node.x1 = node.x - bounds;
              node.x2 = node.x + bounds;
              node.y1 = node.y - bounds;
              node.y2 = node.y + bounds;
              quadtree(_this.current_nodes).visit(function(quad, x1, y1, x2, y2) {
                var collide, distance, x, y;
                if (quad.point && quad.point !== node) {
                  x = node.x - quad.point.x;
                  y = node.y - quad.point.y;
                  distance = Math.sqrt(x * x + y * y);
                  collide = node.r + quad.point.r + _this.collision_separation;
                  if (distance < collide) {
                    distance = (distance - collide) / (distance ? distance : Infinity) * 0.5;
                    x *= distance;
                    y *= distance;
                    if (!node.fixed) {
                      node.x -= x;
                      node.y -= y;
                    }
                    if (!quad.point.fixed) {
                      quad.point.x += x;
                      quad.point.y += y;
                    }
                  }
                }
                return x1 > node.x2 || x2 < node.x1 || y1 > node.y2 || y2 < node.y1;
              });
            }
          }
          _this.circles.attr('cx', function(d) {
            return d.x;
          }).attr('cy', function(d) {
            return d.y;
          });
          _this.circles.each(function(d) {
            return d.animated_r = +$(this).attr('r');
          });
          _this.lines.each(function(d) {
            return d.radian = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x);
          });
          return _this.lines.attr('x1', function(d) {
            return d.source.x + d.source.animated_r * Math.cos(d.radian);
          }).attr('y1', function(d) {
            return d.source.y + d.source.animated_r * Math.sin(d.radian);
          }).attr('x2', function(d) {
            return d.target.x - (d.target.animated_r + 2) * Math.cos(d.radian);
          }).attr('y2', function(d) {
            return d.target.y - (d.target.animated_r + 2) * Math.sin(d.radian);
          });
        };
      })(this));
      this.force.charge((function(_this) {
        return function(d) {
          return (_this.value(d) / _this.total_value) * (-_this.max_r * 200);
        };
      })(this));
      this.force.linkStrength(function(d) {
        if (d.decimated) {
          return 0.001;
        } else {
          return 1;
        }
      });
      this.force.linkDistance(function(d) {
        return (1000 / (-(d.source.targets.length + d.target.sources.length) - 16)) + 80;
      });
      this.zoomer = d3.behavior.zoom().scaleExtent([0.25, 10]).on('zoom', (function(_this) {
        return function() {
          return _this.g.attr('transform', "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        };
      })(this));
      this.zoomer(this.svg);
      this.svg.on('dblclick.zoom', null);
      this.defs.append('marker').attr('id', 'arrow_head').attr('orient', 'auto').attr('refX', this.arrow_size).attr('markerWidth', this.arrow_size).attr('markerHeight', this.arrow_size).attr('viewBox', "0 -5 10 10").append('path').attr('d', "M0,-5L10,0L0,5");
      this.defs.append('marker').attr('id', 'arrow_head_decimated').attr('orient', 'auto').attr('refX', this.arrow_size).attr('markerWidth', this.arrow_size).attr('markerHeight', this.arrow_size).attr('viewBox', "0 -5 10 10").append('path').attr('d', "M0,-5L10,0L0,5");
      return this.defs.append('marker').attr('id', 'arrow_head_select_path').attr('orient', 'auto').attr('refX', this.arrow_size).attr('markerWidth', this.arrow_size).attr('markerHeight', this.arrow_size / 1.5).attr('viewBox', "0 -4 8 10").append('path').attr('d', "M0,-4L10,0L0,4");
    };

    graph.prototype._size = function() {
      return this.force.size([this.width, this.height]);
    };

    graph.prototype.reset = function() {
      var node, _i, _len, _ref;
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (!this.frozen) {
          node.fixed = false;
        }
        delete node.pinned;
        delete node.expanded;
      }
      this.circles.classed('pinned', false);
      this.zoomer.scale(1).translate([0, 0]);
      this.g.attr('transform', '');
      return this.redraw();
    };

    graph.prototype._update = function() {
      var d, event, handler, i, link, merit_node, neighbor, node, nodes, self, source, target, threshold, travel, visited_nodes, _i, _j, _k, _l, _len, _len1, _len10, _len11, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _len9, _m, _n, _o, _p, _q, _r, _ref, _ref1, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _s, _t;
      this.total_value = 0;
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        d = _ref[_i];
        this.total_value += this.value(d);
      }
      if (!this.limit_nodes) {
        if (!this.current_nodes || this.current_links) {
          this.current_nodes = this.nodes;
          this.current_links = [];
          _ref1 = this.current_nodes;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            node = _ref1[_j];
            _ref2 = node.targets;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
              target = _ref2[_k];
              this.current_links.push({
                source: node,
                target: target
              });
            }
          }
        }
      } else {
        nodes = this.nodes.slice(0);
        c4.array.sort_up(nodes, (function(_this) {
          return function(d) {
            return -_this.value(d);
          };
        })(this));
        if (this.limit_percent == null) {
          this.limit_percent = 0;
        }
        threshold = this.limit_percent * this.total_value;
        this.current_nodes = (function() {
          var _l, _len3, _ref3, _results;
          _ref3 = nodes.slice(0, +(this.limit_nodes - 1) + 1 || 9e9);
          _results = [];
          for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
            node = _ref3[_l];
            if (this.value(node) > threshold) {
              _results.push(node);
            }
          }
          return _results;
        }).call(this);
        _ref3 = this.nodes;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          node = _ref3[_l];
          node.visible = false;
        }
        _ref4 = this.current_nodes;
        for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
          node = _ref4[_m];
          node.visible = true;
        }
        merit_node = (function(_this) {
          return function(node) {
            var neighbor, _len5, _len6, _n, _o, _ref5, _ref6, _results;
            if (!node.visible && _this.value(node)) {
              _this.current_nodes.push(node);
              node.visible = true;
              if (node.expanded) {
                _ref5 = node.targets;
                for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
                  neighbor = _ref5[_n];
                  merit_node(neighbor);
                }
                _ref6 = node.sources;
                _results = [];
                for (_o = 0, _len6 = _ref6.length; _o < _len6; _o++) {
                  neighbor = _ref6[_o];
                  _results.push(merit_node(neighbor));
                }
                return _results;
              }
            }
          };
        })(this);
        _ref5 = this.nodes;
        for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
          node = _ref5[_n];
          if (node.show || node.pin) {
            merit_node(node);
          }
          if (node.visible && node.expanded) {
            _ref6 = node.targets;
            for (_o = 0, _len6 = _ref6.length; _o < _len6; _o++) {
              neighbor = _ref6[_o];
              merit_node(neighbor);
            }
            _ref7 = node.sources;
            for (_p = 0, _len7 = _ref7.length; _p < _len7; _p++) {
              neighbor = _ref7[_p];
              merit_node(neighbor);
            }
          }
        }
        this.current_links = [];
        _ref8 = this.current_nodes;
        for (i = _q = 0, _len8 = _ref8.length; _q < _len8; i = ++_q) {
          node = _ref8[i];
          node.index = i;
          node.hidden_neighbors = false;
          visited_nodes = {};
          visited_nodes[this.key(node)] = true;
          _ref9 = node.targets;
          for (_r = 0, _len9 = _ref9.length; _r < _len9; _r++) {
            target = _ref9[_r];
            if (target.visible) {
              this.current_links.push({
                source: node,
                target: target
              });
              visited_nodes[this.key(target)] = true;
            } else {
              if (this.value(target)) {
                node.hidden_neighbors = true;
              }
              travel = (function(_this) {
                return function(travel_from) {
                  var travel_to, _len10, _ref10, _results, _s;
                  if (!_this.value(travel_from)) {
                    return;
                  }
                  _ref10 = travel_from.targets;
                  _results = [];
                  for (_s = 0, _len10 = _ref10.length; _s < _len10; _s++) {
                    travel_to = _ref10[_s];
                    if (visited_nodes[_this.key(travel_to)]) {
                      continue;
                    }
                    visited_nodes[_this.key(travel_to)] = true;
                    if (travel_to.visible) {
                      _results.push(_this.current_links.push({
                        source: node,
                        target: travel_to,
                        decimated: true
                      }));
                    } else {
                      _results.push(travel(travel_to));
                    }
                  }
                  return _results;
                };
              })(this);
              travel(target);
            }
          }
          if (!node.hidden_neighbors) {
            _ref10 = node.sources;
            for (_s = 0, _len10 = _ref10.length; _s < _len10; _s++) {
              source = _ref10[_s];
              if (!source.visible && this.value(source)) {
                node.hidden_neighbors = true;
                break;
              }
            }
          }
        }
        if (this.limit_links && this.current_links.length > this.limit_links) {
          this.current_links = (function() {
            var _len11, _ref11, _results, _t;
            _ref11 = this.current_links;
            _results = [];
            for (_t = 0, _len11 = _ref11.length; _t < _len11; _t++) {
              link = _ref11[_t];
              if (!link.decimated) {
                _results.push(link);
              }
            }
            return _results;
          }).call(this);
        }
      }
      _ref11 = this.current_nodes;
      for (_t = 0, _len11 = _ref11.length; _t < _len11; _t++) {
        node = _ref11[_t];
        node.r = Math.ceil(Math.sqrt(this.value(node) / this.total_value) * this.max_r);
        if ((this.min_r != null) && node.r < this.min_r) {
          node.r = this.min_r;
        }
      }
      this.circles = this.g.selectAll('circle').data(this.current_nodes, this.key);
      this.lines = this.g.selectAll('line').data(this.current_links, (function(_this) {
        return function(d) {
          return _this.key(d.source) + '.' + _this.key(d.target);
        };
      })(this));
      this.new_circles = this.circles.enter().append('circle').attr('r', 0).classed('pinned', function(d) {
        return d.pin;
      }).on('mousedown', function() {
        return d3.event.stopPropagation();
      });
      if (this.node_title != null) {
        this.new_circles.append('title');
        this.circles.selectAll('title').text(this.node_title);
      }
      if (this.node_on != null) {
        _ref12 = this.node_on;
        for (event in _ref12) {
          handler = _ref12[event];
          this.new_circles.on(event, handler);
        }
      }
      this.new_lines = this.lines.enter().insert('line', ':first-child').style('opacity', 0);
      this.circles.exit().transition().duration(750).style('opacity', 0).remove();
      this.circles.transition().duration(0).style('opacity', 0.9);
      this.lines.exit().transition().duration(750).style('opacity', 0).remove();
      this.lines.transition().duration(1000).style('opacity', 1);
      this.circles.transition().duration(2000).attr('r', (function(_this) {
        return function(d) {
          return d.r;
        };
      })(this));
      self = this;
      this.force.drag().on('dragstart', function(d) {
        var e;
        e = d3.event.sourceEvent;
        d.dragging = true;
        d.dragstart_x = d.x;
        d.dragstart_y = d.y;
        if (e.which === 1 && !e.ctrlKey) {
          d3.select(this).classed('pinned', true);
        }
        if (e.which === 3 && !d.expanded) {
          d.expanded = 'tentative';
          self.redraw('drag');
          if (!d.pin) {
            return $(this).on('mousemove.drag', function() {
              return d3.select(this).classed('pinned', d.x !== d.dragstart_x || d.y !== d.dragstart_y);
            });
          }
        }
      }).on('dragend', function(d) {
        var e;
        $(this).off('mousemove.drag');
        e = d3.event.sourceEvent;
        d.dragging = false;
        if (self.frozen) {
          d.fixed = true;
          if (e.which === 3) {
            d.expanded = d.expanded === 'tentative';
            if (!d.expanded) {
              self.redraw('drag');
            }
          } else if (!e.ctrlKey) {
            if (d.x === d.dragstart_x && d.y === d.dragstart_y) {
              d.pin = !d.pin;
            }
          }
        } else {
          if (e.which === 3) {
            if (d.x === d.dragstart_x && d.y === d.dragstart_y) {
              d.expanded = d.expanded === 'tentative';
            } else {
              d.expanded = true;
              d.fixed = d.pin = true;
            }
            if (!d.expanded) {
              self.redraw('drag');
            }
          } else if (!e.ctrlKey) {
            if (d.x === d.dragstart_x && d.y === d.dragstart_y) {
              d.pin = !d.pin;
            } else {
              d.pin = true;
            }
            d.fixed = d.pin;
          }
        }
        return d3.select(this).classed('pinned', d.pin);
      });
      this.new_circles.call(this.force.drag);
      this.new_circles.on('mouseenter.drag', function(d) {
        return d.fixed = true;
      });
      return this.new_circles.on('mouseleave.drag', (function(_this) {
        return function(d) {
          if (!d.dragging) {
            return d.fixed = _this.frozen ? true : d.pin;
          }
        };
      })(this));
    };

    graph.prototype._draw = function() {
      return this.force.nodes(this.current_nodes).links(this.current_links).start();
    };

    graph.prototype._style = function(style_new) {
      var cb, circles, klass, lines, _ref, _ref1;
      circles = style_new ? this.new_circles : this.circles;
      if (this.node_class != null) {
        circles.attr('class', this.node_class);
      }
      if (this.node_classes != null) {
        _ref = this.node_classes;
        for (klass in _ref) {
          cb = _ref[klass];
          circles.classed(klass, cb);
        }
      }
      if (this.node_color != null) {
        circles.style('fill', this.node_color);
      }
      if (this.node_styles != null) {
        circles.style(this.node_styles);
      }
      lines = style_new ? this.new_lines : this.lines;
      if (this.link_class != null) {
        lines.attr('class', this.link_class);
      }
      if (this.link_classes != null) {
        _ref1 = this.link_classes;
        for (klass in _ref1) {
          cb = _ref1[klass];
          lines.classed(klass, cb);
        }
      }
      if (this.link_color != null) {
        lines.style('stroke', this.link_color);
      }
      if (this.link_styles != null) {
        lines.style(this.link_styles);
      }
      this.circles.classed('hidden_neighbors', function(d) {
        return d.hidden_neighbors;
      });
      return this.lines.classed('decimated', function(d) {
        return d.decimated;
      });
    };

    graph.prototype.freeze = function() {
      var node, _i, _len, _ref, _results;
      if (this.force != null) {
        this.frozen = true;
        this.force.stop();
        _ref = this.nodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(node.fixed = true);
        }
        return _results;
      }
    };

    graph.prototype.unfreeze = function() {
      var node, _i, _len, _ref;
      if (this.force != null) {
        this.frozen = false;
        _ref = this.nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          node.fixed = node.pin;
        }
        return this.force.start();
      }
    };

    return graph;

  })(c4.chart);

}).call(this);

//# sourceMappingURL=c4-graph.js.map
