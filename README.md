# 吸顶组件
页面中经常会有多个组件有吸顶状态，比如沉浸式导航头，楼层tab，条件筛选区域。由于页面是开放给用户自由搭建的，每个有吸顶诉求的组件不知道当前页面中有多少各吸顶组件，也不能确定自己的吸顶顺序。硬编码的方式写死吸顶，或者配置吸顶的位置都会让组件无法适用度低。

所有需要吸顶的组件通过本组件提供的API进行声明，当页面滚动到合适的位置上，该位置上的组件可进入吸顶状态，且不会和其它吸顶组件发生位置冲突。默认情况下，每个组件到达上一个吸顶组件的末尾时开始进入吸顶状态，吸顶的时机和样式可自定义。

## 示例图
<img
  width="400"
  src="https://gw.alicdn.com/imgextra/i3/O1CN01bLHekU1itJ640d6p2_!!6000000004470-1-tps-600-1038.gif" />

提供了3种声明方式把一个普通组件编程可吸顶的组件。

* 继承，default模块是ReactClass，继承它的组件会成为吸顶组件。注意，得是单根结点（多根结点只会让第一个根结点吸顶）。
* StickyView，一个包裹后子元素会吸顶的组件。注意，子元素得是单根结点（多根结点只会让第一个根结点吸顶）。
* 使用hook，提供了一个createStickyRef的hook，给指定的节点声明ref即可变为吸顶组件。

## 示例代码
```js
import { createElement, render } from 'rax';
import DriverUniversal from 'driver-universal';
import Sticky, { StickyView, createStickyRef } from '@ali/rox-sticky-helper';

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
      <div id="d1" style={{ width: 750, lineHeight: 100, backgroundColor: '#fff' }}>
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
    <div id="d2" style={{ width: 750, lineHeight: 100, backgroundColor: '#fff' }}>
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
      style={{ width: 750, lineHeight: 100, backgroundColor: '#fff' }}
    >
      吸顶模块hook
    </div>
  );
}

render(<div>
  <Placeholder style={{ height: 200 }} />
  <Module1 />
  <Placeholder style={{ height: 200 }} />
  <Module2 />
  <Placeholder style={{ height: 200 }} />
  <Module3 />
  <Placeholder style={{ height: 2500 }} />
</div>, null, { driver: DriverUniversal });
```

# 控制吸顶判断
默认情况下碰到上一个吸顶元素的边界会自动吸顶，如果需要自己控制吸顶的时机，重写onStickyScroll方法即可

## 代码
```js
import Sticky from '@ali/rox-sticky-helper';
class Module1 extends Sticky {
  onStickyScroll(helper) {
    // 默认处理逻辑
    const { prevTopDiff, prevBottom, self, isSticky, stickyAPI, forceReflow } = helper;
    const { dom } = self;

    if (isSticky) {
      if (!self.keepSticky) {
        stickyAPI.resetSticky(self);
      } else if (dom.getBoundingClientRect().top != prevBottom) {
        // 吸顶后位置发生偏差，进行二次校准
        // 有时候前一个元素一边吸顶一边高度发生变化，后面的元素需要不断修改吸顶位置
        dom.style.top = `${prevBottom}px`;
      }
    } else if (prevTopDiff <= 0) {
      stickyAPI.setSticky(self, {
        position: 'fixed',
        zIndex: 100,
        top: `${prevBottom}px`,
        ...self.ref.getStickyStyle(helper),
      }, forceReflow);
    }
  }
}
```

# 自动占位元素

组件吸顶后会变成fixed定位脱离文档流，会造成组件下面的内容突然上窜，解除吸顶状态后回归原来的文档流，把下面的内容突然挤下去。为了避免造成页面抖动，吸顶时会在原来的位置上方插入一个和组件本身大小一样的透明占位元素，解除吸顶后再自定移除。

需要注意的是，如果组件的高度是变化的（比如一开始不渲染，异步请求数据后再渲染），请在高度变化后手动更新占位元素高度，调用stickyAPI.updatePlaceholder(组件实例)

```js
import { useEffect } from 'rax';
import Sticky, { StickyView, createStickyRef } from '@ali/rox-sticky-helper';

// 类组件
class Module1 extends Sticky {
  async componentDidMount() {
    // 异步取数据渲染
    const data = await xxxxxx;
    this.setState({
      data
    }, () => {
      this.stickyAPI.updatePlaceholder(this); // 更新占位元素高度
      this.stickyAPI.handleSticky(); // 检测是否需要吸顶
    });
  }
}

// hook
const ref = createStickyRef();
function Module3() {
  useEffect(async () => {
    // 异步取数据渲染
    const data = await xxxxxx;
    this.setState({
      data
    }, () => {
      const { current } = ref;
      if (current) {
        current.stickyAPI.updatePlaceholder(current); // 更新占位元素高度
        current.stickyAPI.handleSticky(); // 检测是否需要吸顶
      }
    });

  }, []);
  return (
    <div ref={ref}>
      吸顶模块hook
    </div>
  );
}

```

# 初始化立刻吸顶
导航组件以及其它处于页面最顶上组件，滚动的时候组件追随页面至少移动3个像素，此时组件距离视口的top是-3px，然后伴随滚动触发判断是否吸顶的逻辑。如果吸顶，组件需要从-3px移动到0px的位置，页面上会出现上下抖动感。

默认情况下，组件声明为吸顶后自动执行一次吸顶判断，像导航头这种组件初始化后就立刻吸顶。如果你的组件和顶部有足够的安全距离，可以手动关闭自动吸顶。


```js
import Sticky, { StickyView } from '@ali/rox-sticky-helper';

// 继承方式
class Module1 extends Sticky {
  // 默认true，初始化立即执行吸顶检测。
  autoStickyTrigger = false;
}

// 组件方式
<StickyView autoStickyTrigger={false} />

```


# 成员对象

|名称|类型|说明|
|:--|:--|:--|
| static stickyRootDOM | HTMLElement \| HTMLDocument | 吸顶相对的根结点，默认是document ||
| autoSticky | Boolean | 默认true，自动把当前react实例加入吸顶队列中。如果设置成false，默认不触发吸顶操作，和普通组件无异。一般是异步render，或者条件render，使得组件最外层dom元素发生变化，需要自己找合适的时机把this加入到吸顶队列中。调用this.stickyAPI.add(this)。 |
| autoStickyTrigger | Boolean | 默认false，是否默认触发一次吸顶判断 |
| stickyAPI | Object | 吸顶相关的方法，详见stickyAPI详解 |


# 成员方法

|方法名称｜说明|入参|返回|
|:--|:--|:--|:--|
|getStickyStyle|吸顶时设置的吸顶样式<br>自带postion: fixed; z-index: 100; top: 前一个吸顶元素的结尾|helper，详解见helper参数|Object，默认 {}。返回自定义样式对象|
|onStickyScroll|当页面发生滚动的时候，每个Sticky组件会自动回掉onStickyScroll方法，并且回传一个helper参数，包含一系列吸顶相关的距离值和通用处理吸顶的API方法|helper，详解见helper参数|无|


# stickyAPI详解

|方法名称|说明|入参|返回|
|:--|:--|:--|:--|
|handleSticky| 所有吸顶元素触发吸顶检测 | >>forceReflow，Boolean，强制清除所有元素的吸顶状态（不清除样式和placeholder）进行重新判定 <br> >>scrollTop，Number，当前滚动位置，默认自动获取<br>>>direction，String，滚动的方向，取值"up"\|"down"，默认"up" | 无|
|add| 把一个react实例添加到吸顶队列中，并按照dom在文档中的顺序进行排序。如果没有对应的dom节点，则不添加；如果实例存在，更新对应的don节点 | >>react实例 | 无 |
|remove| 从吸顶队列中移除指定的react实例 | >>react实例 | 无 |
|setSticky| 设置成吸顶状态，会自动存储吸顶前的状态，便于后面还原 | >>self，当前元素<br>>>scrollStickyTop，触发吸顶时窗口的滚动位置<br>>>stickyStyle，吸顶样式，一般是{postion: 'fixed', top: prevBottom+'px'}| 无 |
|resetSticky| 把元素还原成吸顶之前的状态| >>self，当前元素|
|dynamicStickyScroll| onStickyScroll方法的另一种策略。有时候前一个元素一边吸顶一边高度发生变化，后面的元素需要不断修改吸顶位置<br><code>onStickyScroll(helper) {<br> this.stickyAPI.dynamicStickyScroll(helper); }</code>| >>helper，详解见helper参数 | 无 |
| updatePlaceholder | 更改占位dom的样式。比如高度发生动态变化的时候手动更新占位高度 | >>ref，react实例<br>>>styleNames，Array<String>，默认['height']，需要更新的style<br> | placeholder元素的dom对象 |


# helper参数详解

当页面发生滚动的时候，包含一系列吸顶相关的距离值和通用处理吸顶的API方法

|回调参数|类型|详细说明|
|:--|:--|:--|
|top| Number | 当前元素距离视口的距离 |
|prevTop|Number| 当前元素的前面一个Sticky元素距离视口的距离 |
|prevBottom|Number| 当前元素的前面一个Sticky元素的底部距离视口的距离，当前元素的吸顶位置一般就是这个位置 |
|prevTopDiff|Number| 当前元素距离前面一个Sticky元素的距离 |
|self|Object，{ dom, ref }| dom: 当前元素的dom节点<br> ref: 当前元素的react实例 |
|list|Array，[{ dom, ref }]| 所有继承Sticky类的组件实例，按照在dom中的位置排序 |
|index|Number| 当前元素在所有Sticky实例中的序列 |
|stickyAPI| Object | 详见stickyAPI |
