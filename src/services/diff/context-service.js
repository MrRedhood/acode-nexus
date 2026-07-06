export default class ContextService {
  static collapse(
    diff,
    context = 3
  ) {
    const changed =
      diff
        .map(
          (
            row,
            index
          ) =>
            row.type !==
            "context"
              ? index
              : -1
        )
        .filter(
          index =>
            index >= 0
        );

    if (
      changed.length === 0
    ) {
      return diff;
    }

    const visible =
      new Set();

    changed.forEach(index => {
      for (
        let i =
          index -
          context;
        i <=
        index +
          context;
        i++
      ) {
        if (
          i >= 0 &&
          i <
            diff.length
        ) {
          visible.add(i);
        }
      }
    });

    const result = [];

    let previous =
      -1000;

    for (
      let i = 0;
      i <
      diff.length;
      i++
    ) {
      if (
        !visible.has(i)
      ) {
        continue;
      }

      if (
        i -
          previous >
        1
      ) {
        const hidden =
          i -
          previous -
          1;

        if (
          hidden > 0
        ) {
          result.push({
            type:
              "collapsed",
            hiddenLines:
              hidden
          });
        }
      }

      result.push(
        diff[i]
      );

      previous = i;
    }

    if (
      previous <
      diff.length - 1
    ) {
      result.push({
        type:
          "collapsed",
        hiddenLines:
          diff.length -
          previous -
          1
      });
    }

    return result;
  }
}