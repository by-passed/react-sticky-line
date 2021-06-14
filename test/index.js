import React from 'react';
import { render } from 'react-dom';
import Sticky, { StickyView, createStickyRef } from '../src';

function Placeholder(props) {
  return (
    <div style={{
      width: '100vw',
      paddingTop: 20,
      backgroundColor: '#ee4',
      opacity: .6,
      ...(props && props.style)
    }}>
      不吸顶的内容区域
    </div>
  );
}

// 方法1: 继承
class Module1 extends Sticky {
  getStickyStyle() {
    return { color: '#fff', backgroundColor: '#2990dc' };
  }
  render() {
    return (
      <div id="d1" style={{ width: 750, lineHeight: '100px', backgroundColor: '#fff' }}>
        吸顶模块1
      </div>
    );
  }
}

// 方法2: 包裹组件
function Module2() {
  return <StickyView
    getStickyStyle={() => ({ color: '#fff', backgroundColor: '#f15a4a' })}
  >
    <div id="d2" style={{ width: 750, lineHeight: '100px', backgroundColor: '#fff' }}>
      吸顶模块2
    </div>
  </StickyView>;
}

// 方法3: hooks
function Module3() {
  const ref = createStickyRef({
    getStickyStyle() {
      return { color: '#fff', backgroundColor: '#f39826' };
    }
  });
  return (
    <div ref={ref}
      style={{ width: 750, lineHeight: '100px', backgroundColor: '#fff' }}
    >
      吸顶模块hook
    </div>
  );
}

render(
  <div>
  <Placeholder style={{ height: 200 }} />
  <Module1 />
  <Placeholder style={{ height: 200 }} />
  <Module2 />
  <Placeholder style={{ height: 200 }} />
  <Module3 />
  <Placeholder style={{ height: 2500 }} />
  </div>
  , document.getElementById('app')
);