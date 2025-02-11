//draw data
document.addEventListener("DOMContentLoaded", function () {
    function fetchData() {
        fetch("http://localhost:8081/getAllData")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                const tbody = document.querySelector("#dataTable tbody");
                tbody.innerHTML = ""; // Xóa nội dung cũ trước khi cập nhật

                data.forEach(item => {
                    const row = document.createElement("tr");
                    if (item.NameVNM === "") item.NameVNM = item.Name;

                    // Xác định trạng thái dựa trên NumberProcessed
                    let status = "Bình thường";
                    let statusClass = "text-success"; // Mặc định là xanh (bình thường)

                    if (item.NumberProcessed>0 && ((item.NumberProcessed+1)%50==0 || (item.NumberProcessed+2)%50==0 || (item.NumberProcessed)%50==0) ) {
                        status = "Cảnh báo quá tải";
                        statusClass = "text-danger"; // Đỏ nếu quá tải
                    }

                    row.innerHTML = `
                        <td id="name" class="name d-none">${item.Name}</td>
                        <td>${item.NameVNM}</td>
                        <td id="procTime">
                            <input value="${item.ProcTime}"> 
                        </td>      
                        <td id="numberProcessed">${item.NumberProcessed}</td>    
                        <td class="${statusClass}">${status}</td>       
                    `;
                    tbody.appendChild(row);
                });
            })
            .catch(error => console.error("Error fetching data:", error));
    }

    // Gọi fetchData ngay khi trang load
    fetchData();

    // Cập nhật dữ liệu mỗi 5 giây
    setInterval(fetchData, 5000);
});

//alert
const alertContainer = document.getElementById("alertContainer");
function showAlert(message, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}


const getDataUpate = ()=>{
    const data = [];
    const name = document.querySelectorAll("#dataTable tbody tr #name");
    const procTime = document.querySelectorAll("#dataTable tbody tr #procTime input");
    name.forEach((item,index)=>{
        data[index] = {"item": item.innerHTML, "procTime": procTime[index].value}
    })
    return data;
}

//update processing time
const updateBtn = document.getElementById("updateBtn")
updateBtn.addEventListener("click", async () => {
    const dataList = getDataUpate();
    console.log(dataList);
    if (!Array.isArray(dataList) || dataList.length === 0) {
        console.error("No data available");
        showAlert("No data available to update", "warning");
        return;
    }

    try {
        await Promise.all(dataList.map(async (dataItem) => {
            const data = {
                machineName: dataItem.item,
                newProcTime: dataItem.procTime
            };

            if (!data.machineName || !data.newProcTime) {
                console.error("Missing data fields", data);
                showAlert("Missing data fields", "danger");
                return;
            }

            const response = await fetch("http://localhost:8081/updateData", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to update ProcTime");

            console.log("Update successful:", result);
        }));
        showAlert("All machines updated successfully!", "success");
    } catch (error) {
        console.error("Error updating ProcTime:", error.message);
        showAlert("Error updating ProcTime: " + error.message, "danger");
    }
});

//reset processed number
const resetBtn = document.getElementById("resetNumberProcessedBtn")
resetBtn.addEventListener("click", () => {
    fetch("http://localhost:8081/resetNumberProcessed", {
        method: "PUT"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to reset number processed");
        }
        return response.json(); // If the response is JSON, otherwise use response.text()
    })
    .then(data => console.log("Reset successful:", data))
    .catch(error => console.error("Error:", error));

    showAlert("Reset number processed successfully!", "warning");
})