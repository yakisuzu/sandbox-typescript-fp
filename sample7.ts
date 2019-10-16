console.log("async/awaitで並列と直列を組み合わせる");

(async () => {
  // [1, 2]を直列で実行したいが、[1, 2]の終了を待たずに、[3, 4]と[5]を実行したい
  const keys: number[][] = [[1, 2], [3, 4], [5]];

  const keyPromises: Promise<number[]>[] = keys.map(key => { // mapで並列に
    return key.reduce(async (previousValue, currentValue) => { // reduceで直列に
      const pv: number[] = await previousValue;
      const currentResult: number = await new Promise(resolve =>
        setTimeout(() => resolve(currentValue * 2), 100), // 本来はREST
      );
      return pv.concat([currentResult]);
    }, Promise.resolve([])) as Promise<number[]>;
  });

  console.log(keyPromises); // [Promise.resolve([2, 4]), Promise.resolve([6, 8]), Promise.resolve([10])] の状態

  // await Promise.allで並列の待ち合わせ
  console.log(await Promise.all(keyPromises)); // [[2, 4], [6, 8], [10]]
})();
