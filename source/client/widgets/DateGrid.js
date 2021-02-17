/*

  SmartClient Ajax RIA system
  Version v12.1p_2021-02-17/LGPL Deployment (2021-02-17)

  Copyright 2000 and beyond Isomorphic Software, Inc. All rights reserved.
  "SmartClient" is a trademark of Isomorphic Software, Inc.

  LICENSE NOTICE
     INSTALLATION OR USE OF THIS SOFTWARE INDICATES YOUR ACCEPTANCE OF
     ISOMORPHIC SOFTWARE LICENSE TERMS. If you have received this file
     without an accompanying Isomorphic Software license file, please
     contact licensing@isomorphic.com for details. Unauthorized copying and
     use of this software is a violation of international copyright law.

  DEVELOPMENT ONLY - DO NOT DEPLOY
     This software is provided for evaluation, training, and development
     purposes only. It may include supplementary components that are not
     licensed for deployment. The separate DEPLOY package for this release
     contains SmartClient components that are licensed for deployment.

  PROPRIETARY & PROTECTED MATERIAL
     This software contains proprietary materials that are protected by
     contract and intellectual property law. You are expressly prohibited
     from attempting to reverse engineer this software or modify this
     software for human readability.

  CONTACT ISOMORPHIC
     For more information regarding license rights and restrictions, or to
     report possible license violations, please contact Isomorphic Software
     by email (licensing@isomorphic.com) or web (www.isomorphic.com).

*/
// This file creates a mini-calendar that is used to pick a date, for example, you might have a
// button next to a form date field that brings this file up.




//>	@class	DateGrid
//
// A ListGrid subclass that manages calendar views.
//
// @inheritsFrom ListGrid
// @treeLocation Client Reference/Forms
// @visibility external
//<
if (isc.ListGrid == null) {
    isc.Log.logInfo("Source for DateGrid included in this module, but required " +
        "superclass (ListGrid) is not loaded. This can occur if the Forms module is " +
        "loaded without the Grids module. DateGrid class will not be defined within " + 
        "this page.", "moduleDependencies");
} else {

// create a customized ListGrid to show the days in a month
isc.ClassFactory.defineClass("DateGrid", "ListGrid");

isc.DateGrid.addProperties({
    width: 10,
    height: 10,
    cellHeight: 20,
    minFieldWidth: 20,
    autoFitMaxRows: 5,
    useCellRollOvers: true,
    canSelectCells: true,
    leaveScrollbarGap: false,
    canResizeFields: false,
    headerButtonProperties: {
        padding: 0
    },
    headerHeight: 20,
    canSort: false,
    canEdit: false,

    showSortArrow: isc.ListGrid.NONE,
    showFiscalYear: false,
    showFiscalWeek: false,
    showCalendarWeek: false,
    
    loadingDataMessage: "",
    alternateRecordStyles: false,
    
    showHeaderMenuButton: false,
    showHeaderContextMenu: false,
    
    cellPadding: 0,

    wrapCells: false,

    // we need to locate rows by cell-value, not PK or whatever else
    locateRowsBy: "targetCellValue",
    
    fiscalYearFieldTitle: "Year",
    weekFieldTitle: "Wk",
    
    canReorderFields: false,
    
    bodyProperties: {
        canSelectOnRightMouse: false
    },
    autoFitData: "both",
    
    init : function () {
        // set up all fields 
        var weekends = this.getWeekendDays();
        var _this = this;
        this.fields = [
            { name: "fiscalYear", type: "number", title: this.fiscalYearFieldTitle, 
                width: this.fiscalYearColWidth, 
                align: "center", cellAlign: "center", showRollOver: false, showDown: false,
                baseStyle: this.baseFiscalYearStyle,
                headerBaseStyle: this.fiscalYearHeaderStyle || this.baseFiscalYearStyle,
                showIf : function (list, field) {
                    return list.showFiscalYear == true;
                }
            },
            { name: "fiscalWeek", type: "number", title: this.weekFieldTitle,
                width: 25, 
                align: "center", showRollOver: false, showDown: false,
                baseStyle: this.baseWeekStyle,
                headerBaseStyle: this.weekHeaderStyle || this.baseWeekStyle,
                showIf : function (list, field) {
                    return list.showFiscalWeek == true;
                }
            },
            { name: "calendarWeek", type: "number", title: this.weekFieldTitle, 
                width: 25, 
                align: "center", showRollOver: false, showDown: false,
                baseStyle: this.baseWeekStyle,
                headerBaseStyle: this.weekHeaderStyle || this.baseWeekStyle,
                showIf : function (list, field) {
                    return list.showCalendarWeek == true;
                }
            }
        ];
        for (var i=0; i<7; i++) {
            var isWeekend = (i == weekends[0] || i == weekends[1]);
            var obj = { name: "day"+i, weekStartOffset: i ,
                isWeekend: isWeekend,
                isDateField: true,
                align: "center",
                baseStyle: isWeekend ? this.baseWeekendStyle : this.baseWeekdayStyle,
                headerBaseStyle: isWeekend ? this.weekendHeaderStyle : this.headerBaseStyle,
                showIf: "list.showWeekends || field.isWeekend == false;"
            };
            this.fields.add(obj);
        }

        this.startDate = this.startDate || new Date();
        if (!this.startDate.logicalDate) this.startDate = isc.DateUtil.getLogicalDateOnly(this.startDate)

        this.visibleStart = isc.DateUtil.getStartOf(isc.DateUtil.createLogicalDate(
            this.startDate.getFullYear(), this.startDate.getMonth(), 1), "W");

        // set up grid data - now always 6 rows, each with a weekStart date
        this.data = [];
        var d = this.visibleStart.duplicate();
        var fiscalCalendar = this.getFiscalCalendar();
        for (var i=1; i<7; i++) {
            // fiscal year object for start date
            var fiscalYear = d.getFiscalYear(fiscalCalendar);
            var weekEndDate = isc.DateUtil.getEndOf(d, "W", true)
            var obj = { name: "week" + i,
                // start/end logical dates for the record
                weekStart: d.duplicate(),
                weekEnd: weekEndDate,
                // fiscalYear for the start date
                fiscalYear: fiscalYear.fiscalYear, 
                // fiscalYear for the end date
                fiscalYearEnd: weekEndDate.getFiscalYear(fiscalCalendar).fiscalYear, 

                // fiscal week (for the start date)
                fiscalWeek: d.getFiscalWeek(fiscalCalendar, this.firstDayOfWeek),
                // fiscal week end (for the end date)
                fiscalWeekEnd: weekEndDate.getFiscalWeek(fiscalCalendar, this.firstDayOfWeek),

                // calendar week (for the first day of week)
                calendarWeek: d.getWeek(this.firstDayOfWeek)
            };

            for (var j=0; j<7; j++) {
                obj["day" + j] = j;
            }
            this.data.add(obj);
            d.setDate(d.getDate() + 7);
        }
        return this.Super("init", arguments);
    },

    initWidget : function () {
        this.shortDayNames = isc.DateUtil.getShortDayNames(3);
        this.shortDayTitles = isc.DateUtil.getShortDayNames(this.dayNameLength);
        this.shortMonthNames = isc.DateUtil.getShortMonthNames();
        
        this.Super("initWidget", arguments);
    },
    
    draw : function () {
        var result = this.Super("draw", arguments);
        this.refreshUI();
    },
    
    getTitleField : function () {
        return null;
    },
    
    getCellAlign : function (record, rowNum, colNum) {
        return "center";
    },

    getCellStyle : function (record, rowNum, colNum) {
        var field = this.getField(colNum),
            weekNum = this.getRecordWeekNumber(record),
            selected = weekNum == this.selectedWeek
        ;

        if (field.name == "fiscalYear") {
            return !selected ? this.baseFiscalYearStyle : this.selectedWeekStyle;
        } else if (field.name == "fiscalWeek" || field.name == "calendarWeek") {
            return !selected ? this.baseWeekStyle : this.selectedWeekStyle;
        }

        var date = this.getCellDate(record, rowNum, colNum),
            isDisabled = this.dateIsDisabled(date),
            isOtherMonth = date.getMonth() != this.workingMonth,
            style = this.Super("getCellStyle", arguments);
        ;

        if (field.isDateField) {
            if ((isDisabled || isOtherMonth)) {
                
                style = field.isWeekend ? this.disabledWeekendStyle : this.disabledWeekdayStyle;

                var eventRow = this.body.getEventRow(),
                    eventCol = this.body.getEventColumn(),
                    isOver = (eventRow == rowNum && eventCol == colNum),
                    lastSel = this.selectionManager && this.selectionManager.lastSelectedCell,
                    isSelected = lastSel ? lastSel[0] == rowNum && lastSel[1] == colNum :
                                    this.cellSelection ? 
                                    this.cellSelection.isSelected(rowNum, colNum) : false,
                    overIndex = style.indexOf("Over"),
                    selectedIndex = style.indexOf("Selected")
                ;

                if (overIndex >= 0) style = style.substring(0, overIndex);
                if (selectedIndex >= 0) style = style.substring(0, selectedIndex);
                
                if (isSelected) style += "Selected";
                if (isOver) style += "Over";
            }
        }

        return style;
    },
    
    mouseOut : function () {
        // clear the last hilite 
        this.clearLastHilite();
    },

    cellMouseDown : function (record, rowNum, colNum) {
        var date = this.getCellDate(record, rowNum, colNum);
        if (!date) return true;
        if (this.dateIsDisabled(date)) return false;
        return true;
    },
    
    cellClick : function (record, rowNum, colNum) {
        var date = this.getCellDate(record, rowNum, colNum);
        if (!date) return true;

        if (this.dateIsDisabled(date)) {
            return true;
        }

        this.dateClick(date.getFullYear(), date.getMonth(), date.getDate());
    },
    dateClick : function (year, month, date) {},

    getRecordWeekNumber : function (record) {
        if (!record) return -1;
        return this.showFiscalWeek ? record.fiscalWeek : record.calendarWeek;
    },

    isSelectedWeek : function (record) {
        return this.getRecordWeekNumber(record) == this.selectedWeek;
    },

    cellSelectionChanged : function (cellList) {
        var sel = this.getCellSelection();
        for (var i=0; i<cellList.length; i++) {
            var cell = cellList[i];
            if (sel.cellIsSelected(cell[0], cell[1])) {
                var weekNum = this.getRecordWeekNumber(this.getRecord(cell[0]));
                if (this.selectedWeek != weekNum) {
                    this.setSelectedWeek(weekNum);
                }
                return;
            }
        }
        return;
    },
    
    setSelectedWeek : function (weekNum) {
        this.selectedWeek = weekNum;
        this.markForRedraw();
        this.selectedWeekChanged(this.selectedWeek);
    },
    selectedWeekChanged : function (weekNum) {},
    
    getWorkingMonth : function () {
        return this.workingMonth;
    },
    getSelectedDate : function () {
        return null;
    },
    
    disableMarkedDates : function () {
        this.disabledDateStrings = {};
        if (this.disabledDates && this.disabledDates.length > 0) {
            for (var i=0; i<this.disabledDates.length; i++) {
                this.disabledDateStrings[this.disabledDates[i].toShortDate()] = true;
            }
        }
    },

    dateIsDisabled : function (date) {
        if (!date) return;
        if (this.disableWeekends && this.dateIsWeekend(date)) return true;
        var disabled = this.disabledDateStrings && 
                this.disabledDateStrings[date.toShortDate()];
        return disabled;
    },
    
    getCellDate : function (record, rowNum, colNum) {
        var field = this.getField(colNum);
        if (field.weekStartOffset == null) return null;
        var rDate = record.weekStart.duplicate();
        rDate.setDate(rDate.getDate() + field.weekStartOffset);
        return rDate;
    },

    selectDateCell : function (date) {
        var selection = this.getCellSelection(),
            cell = this.getDateCell(date)
        ;

        if (!cell) {
            // selected date isn't visible - clear the selection - selected date will be 
            // reselected if it re-appears later
            if (selection && selection.deselectAll) selection.deselectAll();
            return;
        }
        
        if (cell.colNum != null) selection.selectSingleCell(cell.rowNum, cell.colNum);
        this.setSelectedWeek(this.getRecordWeekNumber(cell.record));
    },

    getDateCell : function (date) {
        //this.logWarn("in getDateCell()");
        // returns an object with rowNum, colNum and record
        var selection = this.getCellSelection(),
            data = this.data
        ;

        if (date && data && data.length > 0) {
            var dayCount = this.showWeekends == false ? 5 : 7;
            var dateDay = date.getDay();
            var fieldName = "day" + dateDay;
            var field = this.getField(fieldName);
            var fieldNum = field ? this.getFieldNum(field.name) : null;
            for (var i=0; i<data.length; i++) {
                var record = data[i];
                var cellDate = record.weekStart.duplicate();
                if (cellDate) {
                    cellDate.setDate(cellDate.getDate() + field.weekStartOffset);
                    if (isc.DateUtil.compareLogicalDates(cellDate, date) == 0) {
                        return { rowNum: i, colNum: fieldNum, record: record };
                    }
                }
            }
        }
    },

    shouldDisableDate : function (date) {
        var result = this.dateIsDisabled(date);
        return result;
    },

    getCellValue : function (record, rowNum, colNum, body) {
        var date = this.getCellDate(record, rowNum, colNum);
        if (date) return date.getDate();
        return this.Super("getCellValue", arguments);
    },

    getFieldTitle : function (fieldId) {
        var f = this.getField(fieldId);
        if (f.weekStartOffset != null) {
            //this.logWarn("field " + fieldId + " has title " + 
            //    this.shortDayTitles[isc.DateUtil.getFirstDayOfWeek() + f.weekStartOffset]
            //);
            return this.shortDayTitles[isc.DateUtil.getFirstDayOfWeek() + f.weekStartOffset];
        }
        return this.Super("getFieldTitle", arguments);
    },

    setStartDate : function (startDate) {
        if (startDate) this.startDate = startDate;
        this.workingMonth = this.startDate.getMonth();
        this.visibleStart = this.startDate = isc.DateUtil.getStartOf(isc.DateUtil.getStartOf(this.startDate, "M"), "W", true);

        // iterate over the grid data - now always 6 rows, each with a weekStart date
        var d = this.visibleStart.duplicate()
        var fiscalCalendar = this.getFiscalCalendar();
        for (var i=0; i<6; i++) {
            // fiscal year object for start date
            var fiscalYear = d.getFiscalYear(fiscalCalendar);
            var weekEndDate = isc.DateUtil.getEndOf(d, "W", true);
            isc.addProperties(this.data[i], {
                weekStart: d.duplicate(),
                weekEnd: weekEndDate,
                // fiscalYear for the start date
                fiscalYear: fiscalYear.fiscalYear, 
                // fiscalYear for the end date
                fiscalYearEnd: weekEndDate.getFiscalYear(fiscalCalendar).fiscalYear, 

                // fiscal week (for the start date)
                fiscalWeek: d.getFiscalWeek(fiscalCalendar, this.firstDayOfWeek),
                // fiscal week end (for the end date)
                fiscalWeekEnd: weekEndDate.getFiscalWeek(fiscalCalendar, this.firstDayOfWeek),

                // calendar week (for the first day of week)
                calendarWeek: d.getWeek(this.firstDayOfWeek)
            });
            d.setDate(d.getDate() + 7);
        }
        this.disableMarkedDates();
        
        // see whether showIf needs re-evaluating on the fields
        var needsFieldUpdate = (this.showWeekends != this._showWeekends) ||
            (this.showFiscalYear != this.fieldIsVisible("fiscalYear")) ||
            (this.showFiscalWeek != this.fieldIsVisible("fiscalWeek")) ||
            (this.showCalendarWeek != this.fieldIsVisible("calendarWeek"))
        ;

        if (needsFieldUpdate) {
            this.refreshFields();
        }

        // do an immediate redraw() to update visible fields - needed for autoTests
        if (this.isDrawn()) this.redraw();

        // select the current date (this.startDate)
        this.selectDateCell(this.getSelectedDate()) 

        // remember showWeekends, to check for a change on the next run through this method
        this._showWeekends = this.showWeekends;
    },

    refreshUI : function (startDate) {
        startDate = startDate || this.startDate;
        if (startDate) this.setStartDate(startDate);
    },

    fiscalYearColWidth: 30,
    getWeekendDays : function () {
        if (!this.weekendDays) this.weekendDays = isc.DateUtil.getWeekendDays();
        return this.weekendDays;
    },
    dateIsWeekend : function (date) {
        if (!date) return false;
        var wd = this.getWeekendDays();
        return date.getDay() == wd[0] || date.getDay() == wd[1];
    },

    buildCalendarData : function (startDate) {
        if (startDate) this.startDate = startDate;
        startDate = this.startDate;
        
        var records = [],
            date = startDate,
            startMonth = this.startDate.getMonth(),
            // start date is start of the week - likely in the previous month.
            // We may need to jump up a year:
            // - working month is dec - end date will be start of jan of next year
            // - start date is dec, working month is jan (of next year after start date),
            //   end date is start of feb
            yearWrap = (startMonth == 11 || this.workingMonth == 11),
            sDate2 = isc.DateUtil.createLogicalDate(startDate.getFullYear() + (yearWrap ? 1 : 0), 
                            (this.workingMonth == 11 ? 0 : this.workingMonth + 1), 1)
        ;
        var delta = (sDate2.getTime() - date.getTime()) / 1000 / 60 / 60 / 24,
            weeks = delta / 7
        ;
        
        var counter = Math.floor(weeks) + (delta % 7 > 0 ? 1 : 0);
        
        for (var i =0; i<=counter; i++) {
            var thisDate = isc.DateUtil.createLogicalDate(date.getFullYear(), date.getMonth(),
                                                          date.getDate() + (i*7));
            if (i == counter && thisDate.getMonth() != this.workingMonth) {
                break;
            }
            records.add(this.getWeekRecord(thisDate));
            //this.logWarn("got week record " + thisDate.toString());
        }

        this.data = records;
        this.setFields(this.getFieldList());

        this.selectDateCell(this.getSelectedDate()) 
    },

    getFiscalCalendar : function () {
        return this.fiscalCalendar || isc.DateUtil.getFiscalCalendar();
    },

    
    // set this to false to allow the DateGrid to NOT always show fiscal week 1 - instead, it 
    // may show either the highest partial week or 1, depending on where the fiscalStartDate is
    alwaysShowFirstFiscalWeek: true,
    getWeekRecord : function (date) {
        var fiscalCalendar = this.getFiscalCalendar(),
            // fiscal year object for start date
            fiscalYear = date.getFiscalYear(fiscalCalendar),
            // end of week date
            endDate = isc.DateUtil.dateAdd(date.duplicate(), "d", 6)
        ;

        if (date.logicalDate) endDate.logicalDate = true;

        // use the fourth day of the week to determine which week-number to display
        var weekDate = isc.DateUtil.dateAdd(date.duplicate(), "d", 4);

        var record = { 
            // first date within the row
            rowStartDate: date,
            rowEndDate: endDate.duplicate(),
            
            // fiscalYear for the start date
            fiscalYear: fiscalYear.fiscalYear, 
            // fiscalYear for the end date
            fiscalYearEnd: endDate.getFiscalYear(fiscalCalendar).fiscalYear, 
            
            // fiscal week (for the start date)
            fiscalWeek: date.getFiscalWeek(fiscalCalendar, this.firstDayOfWeek),
            // fiscal week end (for the end date)
            fiscalWeekEnd: endDate.getFiscalWeek(fiscalCalendar, this.firstDayOfWeek),
            
            // calendar week (for the first day of week)
            calendarWeek: weekDate.getWeek(this.firstDayOfWeek),

            weekDate: weekDate
        };
        
        
        
        // If we hit a fiscal week boundary, or a fiscalYear boundary, show the
        // week / year title in which more days in the week fall.
        
        if (record.fiscalWeek != record.fiscalWeekEnd) {

            var roundUpYear = false,
                roundUpWeek = false;
                
            if (record.fiscalYear != record.fiscalYearEnd) {
                if (!this.alwaysShowFirstFiscalWeek) {
                    var newYearStartDay =  Date.getFiscalStartDate(endDate, fiscalCalendar).getDay(),
                        delta = newYearStartDay - this.firstDayOfWeek;
                    if (delta < 0) delta += 6;
                    if (delta < 3) roundUpYear = true;
                } else roundUpYear = true;
            }
            
            if (!roundUpYear) {
                var yearStartDay = Date.getFiscalStartDate(date, fiscalCalendar).getDay(),
                    delta = yearStartDay - this.firstDayOfWeek;
                if (delta < 0) delta += 6;
                if (delta > 0 && delta < 3) roundUpWeek = true;
            }
            
            if (roundUpYear) {
                record.fiscalYear = record.fiscalYearEnd;
                record.fiscalWeek = 1;
            } else if (roundUpWeek) {
                record.fiscalWeek += 1;
            }
            
            
            
        }

        var year = date.getFullYear(),
            month = date.getMonth(),
            weekendDays = this.getWeekendDays()
        ;
        for (var i=0; i<7; i++) {
            var thisDate = isc.DateUtil.createLogicalDate(year, month, date.getDate() + i, 0);
            //if (this.showWeekends || !weekendDays.contains(thisDate.getDay())) {
                var dayName = this.shortDayNames[thisDate.getDay()];
                record[dayName] = thisDate;
            //}
        }
        
        return record;
    }
});

} // END of if (isc.ListGrid == null) else case