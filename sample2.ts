console.log("for文で直列実行(reduce前説明)");

(async () => {
  const keys: number[] = [1, 2]; // 前処理で、ループしたい値と回数が決まる

  const keyResults: number[] = []; // constなのに怪しい予感

  // いつものfor文
  for (const key of keys) {
    const p: Promise<number> = new Promise(resolve =>
      setTimeout(() => resolve(key * 2), 100), // 本来はREST
    );

    keyResults.push(await p); // keyResultsに副作用がある！
  }
  console.log(keyResults); // [2, 4]
  // 直列で実行できたが副作用が混ざっている...
})();
