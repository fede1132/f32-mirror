$(() => {
    if (window.location.href.includes("failure=true")) {
        $("#alert")[0].style.display = "block";
    }
})