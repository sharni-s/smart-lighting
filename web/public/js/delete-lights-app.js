$("#delete-devices-btn").click(function () {
  let deviceIds = [];
  $(".cb:checkbox:checked").each(function () {
    deviceIds.push($(this).attr("id"));
  });
  const body = {
    deviceIds,
  };
  $.post(`/delete-lights`, body).then((response) => {
    console.log(response);
    if (response.data == "DELETION ERROR") {
      $(".del-err").html(
        `<p class="my-2 text-center fs-5">An error occured while deleting devices</p>`
      );
    } else {
      window.location.assign(`/delete-lights`);
    }
  });
});
