$(document).ready(function () {
    var multipleCancelButton = new Choices(".choices-multiple-remove-button", {
      removeItemButton: true,
    });
    var multipleCancelButton1 = new Choices(
      ".choices-multiple-remove-button-max-1",
      {
        removeItemButton: true,
        maxItemCount: 1,
      }
    );
  });
  