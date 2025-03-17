{pkgs}: {
  deps = [
    pkgs.rsync
    pkgs.nix-output-monitor
    pkgs.pm2
    pkgs.jq
    pkgs.postgresql
  ];
}
