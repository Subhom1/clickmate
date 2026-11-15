const categoryTitles = {
  hikes: "Hikes to do together",
  movies: "Movies to watch together ",
};

// Use one label for each activity category across the list and search screens.
export function getCategoryTitle(category) {
  return categoryTitles[category] ?? "";
}
