
// VALIDATION & FEEDBACK

// Show success/error message on the screen
function showToast(message, type = "success") {

    // Remove an existing toast if there is one
    const oldToast = document.querySelector(".toast");

    if (oldToast) {
        oldToast.remove();
    }

    // Create new toast
    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}


// Main validation function
function validateTransaction({ booth, service, amount }) {

    // Checks booths, services and amounts 
    if (!booth) {
        return "Please Select a Booth...";
    }

    if (!service) {
        return "Please Select a Service.";
    }

    if (!amount || Number(amount) <= 0) {
        return "Please enter a valid transaction amount.";
    }

    if(!services[service]) {
        return "Invalid service selected!!";
    }

    // Checks for the same transaction
    const duplicate = transactions.some(transaction => {

        return (
            transaction.booth === booth &&
            transaction.service === service &&
            Number(transaction.amount) === Number(amount)
        );

    });

    if (duplicate) {
        return "This transaction already exists.";
    }

// Calculate the current total for the selected service
    let currentTotal = 0;

transactions.forEach(transaction => {

    if (transaction.service === service) {
        currentTotal += Number(transaction.amount);
    }

});

    //service limit from data
    const serviceLimit = services[service].limit;

    //new  transaction 
    const newTotal = currentTotal + Number(amount);

    if (newTotal > serviceLimit) {
        const remaining = serviceLimit - currentTotal;

        return `${service} Limit exceeded. Remaining Amount: K ${ remaining.toFixed(2)}`;
    }

    // No error
    return "";
}