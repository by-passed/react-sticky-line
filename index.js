'use strict';
import { Component } from 'react';
import { findDomNode } from 'react-dom';

const stickyAPI = {
  list: [],

  _inited_: false,
  init(rootDOM = document) {
    if (!this._inited_) {
      this._inited_ = true;
      rootDOM.addEventListener("scroll", () => {
        this.handleSticky();
      }, { passive: true, capture: true });
    }
  },

  handleSticky(forceReflow = false) {
    const { list } = this;
    list.forEach((node, index) => {
      const { dom, ref } = node;
      if (dom) {
        const rect = node.dom.getBoundingClientRect();

        const prevNode = list[index - 1];
        const prevRect = prevNode ? prevNode.dom.getBoundingClientRect() : { top: 0, height: 0 };
        const prevBottom = prevRect.top + prevRect.height;
  
        ref.onStickyScroll({
          forceReflow,
  
          // 距离顶上
          top: rect.top,
  
          prevTop: prevRect.top,
          prevBottom,
          // 距离前一个吸顶的距离
          prevTopDiff: index === 0 ? rect.top : rect.top - prevBottom,
  
          self: node,
          list,
          index,
  
          stickyAPI: this
        });
      }
    });
  },

  add(ref) {
    if (!this.list.find(n => n.ref === ref)) {
      
      const placeholderDOM = document.createElement('div');
      placeholderDOM.setAttribute('sticky-role', 'placeholder');

      this.list.push({
        ref,

        // 占位元素
        placeholderDOM,
        // 占位元素是否添加到dom中
        isPlaceholderIn: false,

        // 吸顶前的样式
        _setStickyStyle_: null,
        get dom() {
          const dom = findDOMNode(this.ref);
          return dom && dom.nodeType === 1 ? dom : null;
        },

      /**是否应该从吸顶状态回到非吸顶状态
       * 占位元素的绝对位置大于吸顶元素，解除吸顶状态
       */
        get keepSticky() {
          const { dom, placeholderDOM, isPlaceholderIn } = this;
          if (dom && isPlaceholderIn) {
            return placeholderDOM.getBoundingClientRect().top <= dom.getBoundingClientRect().top;
          }
          return true;
        },

        addPlaceholder() {
          const { dom, placeholderDOM } = this;
          if (!this.isPlaceholderIn && dom && dom.parentNode) {
            dom.parentNode.insertBefore(placeholderDOM, dom);
            this.isPlaceholderIn = true;
          }
        },

        removePlaceholder() {
          const { dom, placeholderDOM } = this;
          if (this.isPlaceholderIn && dom && dom.parentNode) {
            dom.parentNode.removeChild(placeholderDOM);
            this.isPlaceholderIn = false;
          }
        },
      });
      this.sort();
    }
  },

  remove(ref) {
    const index = this.list.findIndex(node => node.ref === ref);
    if (index > -1) {
      this.list.splice(index, 1);

      // 移除占位元素
      const node = this.list[index];
      node.removePlaceholder();
    }
  },

  find(ref) {
    return this.list.find(node => node.ref === ref);
  },

  sort() {
    return this.list.sort((a, b) => {
      try {
        const v = a.dom.compareDocumentPosition(b.dom);
        if (v === 4 || v === 20) { // a在b之前
          return -1;
        } else if (v === 2 || v === 10) { // a在b之后
          return 1;
        }
      } catch (e) {
        return 1;
      }
    });
  },

  // 置为吸顶状态。会自动保存吸顶前的样式，便于后面回到吸顶前的状态
  setSticky(node, style = {}, forceReflow = false) {
    // 从未设置吸顶转为吸顶，存储吸顶前的样式
    if (forceReflow || !node.isSticky) {
      node.isSticky = true;
      const { dom, placeholderDOM } = node;
      // 向下滚动，当前组件从吸顶还原回正常状态，由于前置的组件还是吸顶状态不占高度，当前组件会上移。创建一个占位元素
     
      this._updatePlaceholder(placeholderDOM, dom);
      const styleNames = Object.keys(style);
      const stickyStyle = {};
      for (const styleName of styleNames) {
        stickyStyle[styleName] = dom.style[styleName];
        dom.style[styleName] = style[styleName];
      }
      node.addPlaceholder();
      node._setStickyStyle_ = stickyStyle;
    }
  },

  // 还原回吸顶前的状态
  resetSticky(node) {
    node.isSticky = false;
    const { _setStickyStyle_ } = node;
    // 还原吸顶前的样式状态
    if (_setStickyStyle_) {
      const { dom } = node;
      const styleNames = Object.keys(_setStickyStyle_);
      for (const styleName of styleNames) {
        dom.style[styleName] = _setStickyStyle_[styleName];
      }

      node.removePlaceholder();
      node._setStickyStyle_ = null;
    }
  },

  /**默认吸顶策略
   * @param {*} helper 
   */
  dynamicStickyScroll(helper) {
    const {
      prevTopDiff, // 和前一个吸顶组件之间的距离
      prevBottom, // 前一个吸顶组件的底部边界在视口的位置
      self, // 吸顶队列中的自己
      stickyAPI, // 吸顶相关的API
      forceReflow
    } = helper;
    
    const {
      dom, // 组件的dom元素
      isSticky // 是否吸顶
    } = self;

    if (isSticky) {
      if (!self.keepSticky) { // 是否该解除吸顶了
        stickyAPI.resetSticky(self);
      } else if (dom.getBoundingClientRect().top != prevBottom) {
        // 吸顶后位置发生偏差，进行二次校准
        // 有时候前一个元素一边吸顶一边高度发生变化，后面的元素需要不断修改吸顶位置
        dom.style.top = `${prevBottom}px`;
      }
    } else if (prevTopDiff <= 0) { // 距离上个吸顶元素小于等于0
      stickyAPI.setSticky(self, { // 调用吸顶设置API
        position: 'fixed',
        zIndex: 100,
        top: `${prevBottom}px`,
        ...self.ref.getStickyStyle(helper), // 获取用户自定义吸顶样式
      }, forceReflow);
    }
  },

  /**
   * 更新占位dom的样式，默认重新获取高度
   */
  _updatePlaceholder(placeholderDOM, dom, styleNames = ['position', 'top', 'left', 'bottom', 'right', 'display', 'margin', 'padding', 'width', 'height', 'border']) {
    if (placeholderDOM && dom) {
      let domStyle = {};
      try {
        domStyle = getComputedStyle(dom);
      } catch (e) {}
      for (const key of styleNames) {
        placeholderDOM.style[key] = domStyle[key];
      }
      placeholderDOM.style.opacity = 0;
    }
  },

  // 对外暴露用来动态调整
  updatePlaceholder(ref, styleNames = ['height']) {
    const node = this.find(ref);
    if (node) {
      this._updatePlaceholder(node.placeholderDOM, node.dom, styleNames);
    }
  }

};

const defaultMembers = {
  stickyAPI,
  autoSticky: true,
  autoStickyTrigger: true,
  onStickyScroll: stickyAPI.dynamicStickyScroll,
  getStickyStyle() {
    return {};
  }
};

class Sticky extends Component {
  static stickyRootDOM = document;
  stickyAPI = defaultMembers.stickyAPI;
  autoSticky = defaultMembers.autoSticky;
  autoStickyTrigger = defaultMembers.autoStickyTrigger;

  constructor(props) {
    super(props);
    const { stickyAPI } = this;
    stickyAPI.init(Sticky.stickyRootDOM);
    setTimeout(() => {
      if (this.autoSticky) {
        stickyAPI.add(this);
        if (this.autoStickyTrigger) {
          stickyAPI.handleSticky();
        }
      }
    });
  }

  componentWillUnmount() {
    this.stickyAPI.remove(this);
  }

  getStickyStyle(...args){
    return defaultMembers.getStickyStyle(...args);
  }

  onStickyScroll(...args) {
    return defaultMembers.onStickyScroll(...args);
  }
}

function setProps(target, props, fields = ['autoSticky', 'autoStickyTrigger', 'getStickyStyle', 'onStickyScroll']) {
  const obj = {};
  fields.forEach(field => {
    if (props.hasOwnProperty(field) && props[field] !== undefined) {
      obj[field] = props[field];
    }
  });
  
  Object.assign(target, obj);
}

class StickyView extends Sticky {
  constructor(props) {
    super(props);
    stickyAPI.init(Sticky.stickyRootDOM);
    setProps(this, props);
  }

  componentWillReceiveProps(nextProps) {
    setProps(this, nextProps, ['getStickyStyle', 'onStickyScroll']);
  }

  render() {
    return this.props.children;
  }
}

// hooks
function createStickyRef(props) {
  stickyAPI.init(Sticky.stickyRootDOM);
  return {
    _current: null,
    set current(current) {
      if (!current) {
        // 移除
        stickyAPI.remove(this._current);
      } else {
        if (!this._current) {
          // 从无到有，加入吸顶队列，合成吸顶API
          addHookRef(current, props);
        } else if (this._current !== current) {
          // 新加入的实例和之前的不一样，先移除旧实例，再添加新实例
          stickyAPI.remove(this._current);
          addHookRef(current, props);
        }
      }
      this._current = current;
    },
    get current() {
      return this._current;
    }
  };
}

function addHookRef(ref, props) {
  if (ref) {
    Object.assign(ref, defaultMembers);
    setProps(ref, props);
    stickyAPI.add(ref);
    setTimeout(() => {
      if (ref.autoStickyTrigger) {
        stickyAPI.handleSticky();
      }
    });
  }
  return ref;
}

export {
  StickyView,
  createStickyRef,
};
export default Sticky;
