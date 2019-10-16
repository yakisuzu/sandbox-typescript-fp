console.log("Promise.allでasync/awaitを並列実行");
const p1: Promise<number> = new Promise(resolve => {
  setTimeout(() => {
    resolve(1); // 本来はRESTする処理など想定
  }, 1000); // 1秒待つ
});
const p2: Promise<number> = new Promise(resolve => {
  setTimeout(() => {
    resolve(2); // 本来はRESTする処理など想定
  }, 100); // 0.1秒待つ
});

// 処理の終わりを待ってないので、直接は使えない
// console.log(p1 + p2); // 3にはならないし、TSではコンパイルエラー

(async () => {
  // p1とp2を並列で実行し、終わるタイミングを待ち合わせる
  const result: number[] = await Promise.all([p1, p2]); // await Promise.allで全て処理終わるのを待つ
  console.log(result); // [1, 2]
})();
