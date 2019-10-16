console.log("reduceでasync/awaitを直列実行");

(async () => {
  const keys: number[] = [1, 2]; // 前処理で、ループしたい値と回数が決まる

  // reduceはひとつひとつ実行する処理
  const keyResults: Promise<number[]> = keys.reduce(async (previousValue, currentValue) => {
    const pv: number[] = await previousValue; // 一つ前の値をawaitすることで処理を待てる
    const currentResult: number = await new Promise(resolve =>  // 現在の処理待ち
      setTimeout(() => resolve(currentValue * 2), 100), // 本来はREST
    );
    return pv.concat([currentResult]); // 前回の処理に、現在処理した値をつなげていく
  }, Promise.resolve([])); // 1件目を処理する時の初期値

  console.log(await keyResults); // [2, 4]
  // 直列で実行できたし、変数に副作用もない
})();
