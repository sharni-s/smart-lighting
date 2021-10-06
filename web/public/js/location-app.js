
$("#light-submit").click(function () {
  $("#light-form").submit();
});

var lightBrDiv = document.getElementById("light-brightness");
if (lightBrDiv) {
  document
    .getElementById("light-brightness")
    .addEventListener("input", function (e) {
      let op = this.value / 100;
      $(".lamp-icon").css("opacity", `${op}`);
    });
}

var lightColDiv = document.getElementById("light-colour");
if (lightColDiv) {
  document
    .getElementById("light-colour")
    .addEventListener("input", function (e) {
      let col = this.value;
      $(".light-visualise").css("color", `${col}`);
      $(".light-visualise").css("border-color", `${col}`);
    });
}
