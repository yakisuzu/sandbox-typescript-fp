console.log("普通の再帰");

const result = recursive(2);
console.log(result);

function recursive(num: number, limit: number = 10000): number {
  // 2乗
  const square = num * num;
  // 上限を超えているか
  return square > limit
    // 超えたら終わり
    ? square
    // 超えてなければもう一度、自分自身を実行
    : recursive(square, limit);
}

