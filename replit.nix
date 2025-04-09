{pkgs}: {
  deps = [
    pkgs.nix-output-monitor
    pkgs.pm2
    pkgs.jq
    pkgs.postgresql
  ];
}
