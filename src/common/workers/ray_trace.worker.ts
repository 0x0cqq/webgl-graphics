const webWorker: Worker = self as any; // 创建主进程this指针
webWorker.addEventListener('message', event => {
    // 部署message事件接收主进程的信息
    setTimeout(() => webWorker.postMessage({
        foo: 'boo' // 使用 postMessage 方法向主进程传输信息
    }), 5000);
});
export default null as any; // 默认导出以免爆 my.worker.ts is not a module 这样的错误