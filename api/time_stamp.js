module.exports.getBeggingOfDay = function getBeggingOfDay(){
    var currentdate = new Date();
    var dateString = currentdate.getFullYear() + "-" + (currentdate.getMonth() + 1) + 
    "-" + currentdate.getDate() + " " + "00:00:00"

    return dateString
}

module.exports.getNextDay = function getNextDay(date){
    var newDate = new Date()
    newDate.setDate(newDate.getDate() + 1)

    var dateString = newDate.getFullYear() + "-" + (newDate.getMonth() + 1) + 
    "-" + newDate.getDate() + " " + "00:00:00"

    return dateString
}

module.exports.getDateNow = function getDateNow(){
    var currentdate = new Date();
    var dateString = currentdate.getFullYear() + "-" + 
    (currentdate.getMonth() + 1) + "-" + currentdate.getDate() + " " + 
    currentdate.getHours() + ":" + currentdate.getMinutes() + ":" +
    currentdate.getSeconds();

    return dateString;
}

module.exports.getSecondsPast = function getSecondsPast(date){
    var date1 = new Date(date)
    var date2 = new Date()

    return Math.ceil((date2.getTime() - date1.getTime())/1000)
}

