export type SuspendedModFilterValues = {
  searchInput: string;
};

type GetSuspendedModFilterValuesInput = {
  route: any;
};

export const getSuspendedModFilterValuesFromParams = function (
  input: GetSuspendedModFilterValuesInput,
): SuspendedModFilterValues {
  const { route } = input;
  const cleanedValues: SuspendedModFilterValues = {
    searchInput: "",
  };

  for (const key in route?.query || {}) {
    const val = route.query[key];

    switch (key) {
      case "searchInput":
        if (typeof val === "string") {
          cleanedValues.searchInput = val;
        }
        break;
    }
  }

  return {
    searchInput: cleanedValues.searchInput || "",
  };
};