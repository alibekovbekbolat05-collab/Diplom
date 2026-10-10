export const thresholds={scanPorts:20,authFailures:10,sprayUsers:6,dosEvents:100,dosPackets:10000,dnsLength:80,beaconSamples:8,beaconCv:0.12,exfilBytes:20*1024*1024,lateralHosts:5,errorBurst:25,stagingFiles:30,officeUtcOffset:5} as const;
export const severityWeight={info:10,low:25,medium:50,high:75,critical:95} as const;
