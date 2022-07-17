let modalOpenState = false;
const modalContainer = document.querySelector("#modal-container");
const modal = document.querySelector("#modal-container > .modal");
const addItemButton = document.querySelector("#add-button");
const filesContainer = document.querySelector(".files-container");
const closeModalButton = document.querySelector("#modal-close");

const uploadFilesFormString = `<form action="/upload" method="post" enctype="multipart/form-data">
				<label>
					Save to path:<br />
					<input type="text" name="filepath" />
				</label>

				<input type="file" multiple="" name="file" />
				<button type="submit">Submit</button>
			</form>`;
const HTTP_METHODS = ["post", "get", "put", "patch", "delete"];

const request = (method, url, data, callback) => {
  const XHR = new XMLHttpRequest();
  if (!HTTP_METHODS.includes(method.toLowerCase()))
    throw new Error(`Could not find method: ${method}`);
  XHR.onload = (event) => {
    if (callback) callback();
  };
  XHR.open(method, url);
  XHR.setRequestHeader("Content-Type", "application/json");
  XHR.send(JSON.stringify(data));
};

addItemButton.addEventListener("click", () => {
  if (modalContainer.classList.contains("hide")) {
    modalContainer.classList.remove("hide");
    modalOpenState = true;
    modal.innerHTML = uploadFilesFormString;
  }
});

closeModalButton.addEventListener("click", () => {
  if (!modalContainer.classList.contains("hide")) {
    modalContainer.classList.add("hide");
    modalOpenState = false;
    modal.innerHTML = "";
  }
});

filesContainer.addEventListener("click", (event) => {
  if (
    (event.target.classList.contains("material-symbols-outlined") &&
      event.target.parentElement.classList.contains("delete-btn")) ||
    event.target.classList.contains("delete-btn")
  ) {
    event.preventDefault();
    console.log("delete btn detected");
    const deleteBtn = event.target.classList.contains(
      "material-symbols-outlined"
    )
      ? event.target.parentElement
      : event.target;
    const { deletePath } = deleteBtn.dataset;
    request("post", "/delete", { deletePath }, () => {
      deleteBtn.parentElement.parentElement.removeChild(
        deleteBtn.parentElement
      );
    });
  }
});

document.addEventListener("keyup", (event) => {
  if ((event.key === "Esc" || event.key === "Escape") && modalOpenState) {
    modalContainer.classList.add("hide");
  }
});
