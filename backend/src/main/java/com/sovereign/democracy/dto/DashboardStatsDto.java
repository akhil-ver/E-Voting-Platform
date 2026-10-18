package com.sovereign.democracy.dto;

public class DashboardStatsDto {
    private long totalAreas;
    private long totalVoterRecords;
    private long totalUserAccounts;
    private long totalElections;
    private long openElections;
    private long closedElections;
    private long electionsWithPublishedResults;

    public DashboardStatsDto() {}

    public DashboardStatsDto(long totalAreas, long totalVoterRecords, long totalUserAccounts,
                             long totalElections, long openElections, long closedElections,
                             long electionsWithPublishedResults) {
        this.totalAreas = totalAreas;
        this.totalVoterRecords = totalVoterRecords;
        this.totalUserAccounts = totalUserAccounts;
        this.totalElections = totalElections;
        this.openElections = openElections;
        this.closedElections = closedElections;
        this.electionsWithPublishedResults = electionsWithPublishedResults;
    }

    public long getTotalAreas() { return totalAreas; }
    public void setTotalAreas(long totalAreas) { this.totalAreas = totalAreas; }

    public long getTotalVoterRecords() { return totalVoterRecords; }
    public void setTotalVoterRecords(long totalVoterRecords) { this.totalVoterRecords = totalVoterRecords; }

    public long getTotalUserAccounts() { return totalUserAccounts; }
    public void setTotalUserAccounts(long totalUserAccounts) { this.totalUserAccounts = totalUserAccounts; }

    public long getTotalElections() { return totalElections; }
    public void setTotalElections(long totalElections) { this.totalElections = totalElections; }

    public long getOpenElections() { return openElections; }
    public void setOpenElections(long openElections) { this.openElections = openElections; }

    public long getClosedElections() { return closedElections; }
    public void setClosedElections(long closedElections) { this.closedElections = closedElections; }

    public long getElectionsWithPublishedResults() { return electionsWithPublishedResults; }
    public void setElectionsWithPublishedResults(long electionsWithPublishedResults) { this.electionsWithPublishedResults = electionsWithPublishedResults; }

    public long getPublishedElections() { return electionsWithPublishedResults; }
    public void setPublishedElections(long publishedElections) { this.electionsWithPublishedResults = publishedElections; }
}
