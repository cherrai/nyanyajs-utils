
export const swapSort = <T = any>(arr: T[], oldIndex: number, newIndex: number) => {
  const tempArr = [...arr];
  const [movedItem] = tempArr.splice(oldIndex, 1);
  tempArr.splice(newIndex, 0, movedItem);
  // if (oldIndex < newIndex) {
  //   for (let i = oldIndex; i < newIndex; i++) {
  //     [tempArr[i], tempArr[i + 1]] = [tempArr[i + 1], tempArr[i]];
  //   }
  // } else {
  //   for (let i = oldIndex; i > newIndex; i--) {
  //     [tempArr[i], tempArr[i - 1]] = [tempArr[i - 1], tempArr[i]];
  //   }
  // }

  return tempArr;
}