import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { apiService, type BlockchainStats } from "@/services/api";

interface IntegrityResult {
  result: string;
  is_valid: boolean;
  timestamp: string;
}

export default function IntegrityPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [integrityResult, setIntegrityResult] =
    useState<IntegrityResult | null>(null);
  const [stats, setStats] = useState<BlockchainStats | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrityData, statsData] = await Promise.all([
        apiService.checkIntegrity(),
        apiService.getStats(),
      ]);

      setIntegrityResult(integrityData);
      setStats(statsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check integrity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecheck = async () => {
    await loadData();
    toast({
      title: "Success",
      description: "Integrity check completed",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Check Integrity</h1>
        <p className="text-muted-foreground mt-2">
          Verify blockchain integrity and detect any tampering
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blockchain Integrity Status
          </CardTitle>
          <CardDescription>
            Cryptographic verification of blockchain data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : integrityResult ? (
            <>
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  integrityResult.is_valid
                    ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                }`}
              >
                {integrityResult.is_valid ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      integrityResult.is_valid
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    }`}
                  >
                    {integrityResult.result}
                  </p>
                  {integrityResult.timestamp && (
                    <p
                      className={`text-xs mt-1 ${
                        integrityResult.is_valid
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      Checked at:{" "}
                      {new Date(integrityResult.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {!integrityResult.is_valid && (
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Blockchain integrity check failed. The data may have been
                    tampered with or corrupted.
                  </p>
                </div>
              )}

              <Button
                onClick={handleRecheck}
                variant="outline"
                className="w-full"
              >
                <Shield className="mr-2 h-4 w-4" />
                Re-check Integrity
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Unable to check integrity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Blocks:</span>
                <span className="font-medium">{stats.total_blocks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Attendance Blocks:
                </span>
                <span className="font-medium">{stats.attendance_blocks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Records:</span>
                <span className="font-medium">
                  {stats.total_attendance_records}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Block</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.latest_block ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Index:</span>
                    <span className="font-mono">
                      {stats.latest_block.index}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hash:</span>
                    <span className="font-mono text-xs break-all">
                      {stats.latest_block.hash?.substring(0, 32)}...
                    </span>
                  </div>
                  {stats.latest_block.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp:</span>
                      <span className="text-xs">
                        {new Date(
                          stats.latest_block.timestamp
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No blocks available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
