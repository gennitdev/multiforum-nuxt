export type SuspendedUserFilterValues = {
  searchInput: string;
};

type GetSuspendedUserFilterValuesInput = {
  route: any;
};

export const getSuspendedUserFilterValuesFromParams = function (
  input: GetSuspendedUserFilterValuesInput,
): SuspendedUserFilterValues {
  const { route } = input;
  const cleanedValues: SuspendedUserFilterValues = {
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