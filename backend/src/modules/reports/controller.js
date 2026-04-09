const reportService = require("./service");

exports.getReports = async (req, res) => {
  try {
    const {
      category,
      type,
      startDate,
      endDate,
      departmentId,
      role,
      employeeId,
    } = req.query;
    let data = [];

    switch (category) {
      case "employee":
        if (type === "list")
          data = await reportService.getEmployeeList(req.query);
        else if (type === "new-joiners")
          data = await reportService.getNewJoiners(req.query);
        else if (type === "exit")
          data = await reportService.getExitReport(req.query);
        else data = await reportService.getEmployeeList(req.query);
        break;
      case "attendance":
        data = await reportService.getAttendanceReport(req.query);
        break;
      case "leave":
        data = await reportService.getLeaveReport(req.query);
        break;
      case "movement":
        data = await reportService.getMovementReport(req.query);
        break;
      case "system":
        data = await reportService.getSystemReport(req.query);
        break;
      case "timesheet":
        // Placeholder for timesheet logic
        data = [];
        break;
      case "summary":
        data = await reportService.getHrOverview(req.user);
        break;
      default:
        return res.status(400).json({ error: "Invalid report category" });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("[Report Controller Error]", error);
    res.status(500).json({ error: error.message });
  }
};
