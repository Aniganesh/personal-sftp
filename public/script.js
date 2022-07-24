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
				<button class="btn-primary-filled" type="submit">Submit</button>
			</form>`;

const confirmationDialogString = `<div class="confirmation-dialog">
				Are you sure you want to delete this?
				<div class="conf-buttons">
					<button id="confirm-button--yes" class="btn-primary-filled">
						Yes
					</button>
					<button id="confirm-button--no">No</button>
				</div>
			</div>`;
const HTTP_METHODS = ["post", "get", "put", "patch", "delete"];

const openModal = () => {
  if (modalContainer.classList.contains("hide")) {
    modalContainer.classList.remove("hide");
    modalOpenState = true;
  }
};
const closeModal = () => {
  if (!modalContainer.classList.contains("hide")) {
    modalContainer.classList.add("hide");
    modalOpenState = false;
    modal.innerHTML = "";
  }
};

const withConfirmationDialog = (action) => {
  modal.innerHTML = confirmationDialogString;
  const yesButton = modal.querySelector("#confirm-button--yes");
  openModal();
  const yesAction = () => {
    action();
    yesButton.removeEventListener("click", yesAction);
    closeModal();
  };
  const noAction = () => {
    closeModal();
    yesButton.removeEventListener("click", noAction);
  };
  yesButton.addEventListener("click", yesAction);
  noButton = modal.querySelector("#confirm-button--no");
  noButton.addEventListener("click", noAction);
};

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
  openModal();
  modal.innerHTML = uploadFilesFormString;
});

closeModalButton.addEventListener("click", () => {
  closeModal();
  modal.innerHTML = "";
});

filesContainer.addEventListener("click", (event) => {
  if (
    (event.target.classList.contains("material-symbols-outlined") &&
      event.target.parentElement.classList.contains("delete-btn")) ||
    event.target.classList.contains("delete-btn")
  ) {
    event.preventDefault();
    // console.log("delete btn detected");
    const deleteBtn = event.target.classList.contains(
      "material-symbols-outlined"
    )
      ? event.target.parentElement
      : event.target;
    const { deletePath } = deleteBtn.dataset;
    withConfirmationDialog(() => {
      request("post", "/delete", { deletePath }, () => {
        deleteBtn.parentElement.parentElement.removeChild(
          deleteBtn.parentElement
        );
      });
    });
  }
});

filesContainer.addEventListener("click", (event) => {
  if (
    (event.target.classList.contains("material-symbols-outlined") &&
      event.target.parentElement.classList.contains("rename-btn")) ||
    event.target.classList.contains("rename-btn")
  ) {
    event.preventDefault();
    // console.log("rename btn detected");
    const renameBtn = event.target.classList.contains(
      "material-symbols-outlined"
    )
      ? event.target.parentElement
      : event.target;
    const { renamePath } = renameBtn.dataset;
    // console.log({ renamePath, dataSet: renameBtn.dataset });
    const form = document.createElement("form");
    const splitPath = renamePath.split("/");
    form.innerHTML = `
    Current Name: ${splitPath.at(-1)}
    <br />
    <label>
    New name for file or folder<br/>
    <input type="text" name="newName" value="${splitPath.at(-1)}" />
    </label>
    <button type="submit" class="btn-primary-filled">Submit</button>
    `;
    modal.appendChild(form);
    openModal();

    form.onsubmit = (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const formValues = [...formData.entries()].reduce((all, entry) => {
        all[entry[0]] = entry[1];
        return all;
      }, {});
      // console.log({ event, formValues });
      request(
        "PATCH",
        "/rename",
        {
          renamePath,
          newPath:
            splitPath.slice(0, splitPath.length - 1).join("/") +
            "/" +
            formValues.newName,
        },
        () => {
          closeModal();
          renameBtn.parentElement.querySelector(".item-name").innerText =
            formValues.newName;
          // console.log("submitted");
        }
      );
    };
  }
});

document.addEventListener("keyup", (event) => {
  if ((event.key === "Esc" || event.key === "Escape") && modalOpenState) {
    closeModal();
  }
});
