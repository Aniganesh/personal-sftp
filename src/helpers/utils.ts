export function isEmpty<T>(
  itemToCheck: T,
  trimString: boolean = true
): boolean {
  let _itemToCheck = itemToCheck;
  if (trimString && typeof _itemToCheck === "string")
    _itemToCheck = _itemToCheck.trim() as T & string;

  if (!_itemToCheck && _itemToCheck !== 0) return true;
  let stringified = JSON.stringify(_itemToCheck);
  if (
    stringified === "{}" ||
    stringified === "[]" ||
    !stringified ||
    stringified === '""'
  )
    return true;
  return false;
}

if (require.main === module) {
  console.log({
    itemToCheckEmptyArray: isEmpty([]),
    itemToCheckEmptyObject: isEmpty({}),
    itemToCheck0: isEmpty(0),
    itemToCheckNumber: isEmpty(6),
    itemToCheckNaN: isEmpty(NaN),
    itemToCheckEmptyString: isEmpty(""),
    itemToCheckSomeTextString: isEmpty("some text"),
    itemToCheckSpacesOnlyStringArg2True: isEmpty("  "),
    itemToCheckSpacesOnlyStringArg2False: isEmpty("  ", false),
  });
}
