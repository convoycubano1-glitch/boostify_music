{pkgs}: {
  deps = [
    pkgs.iproute2
    pkgs.lsof
    pkgs.procps
    pkgs.nix-output-monitor
    pkgs.pm2
    pkgs.jq
    pkgs.postgresql
  ];
}
