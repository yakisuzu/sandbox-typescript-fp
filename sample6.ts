console.log("再帰でasync/awaitを直列実行");

(async () => {
  const result: number = await recursivePromise(2);

  console.log(result);
})();

async function recursivePromise(num: number, limit: number = 10000): Promise<number> {
  // 都度awaitしている
  const square: number = await new Promise(resolve =>
    setTimeout(() => resolve(num * num), 100),  // 本来はREST
  );
  return square > limit
    ? square
    // awaitしてからもう一度実行なので直列
    : await recursivePromise(square, limit);
}
