import React, { useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "../ui/button";
import { useWeb3 } from "../../hooks/use-web3";
import { useWeb3Ready } from "../../lib/context/web3-context";
import { Wallet, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function WalletConnectButton() {
  const { address, isConnected, isWeb3Ready } = useWeb3();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Truncate address for display
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // Show connect button while Web3 is not ready - clicking will show initializing message
  if (!isWeb3Ready) {
    return (
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "⏳ Inicializando Web3...",
            description: "Por favor espera un momento mientras se conecta a la blockchain.",
          });
        }}
        className="gap-2 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/50 hover:border-orange-400 hover:bg-orange-500/30 cursor-pointer"
      >
        <Wallet className="h-4 w-4 text-orange-400" />
        <span className="text-orange-400">Conectar Wallet</span>
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <ConnectButton
        showBalance={false}
        chainStatus="none"
        accountStatus="avatar"
      />
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/20"
        >
          <Wallet className="h-4 w-4 text-orange-400" />
          <span className="text-orange-400 font-medium">{truncatedAddress}</span>
          <ChevronDown className="h-3 w-3 text-orange-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Billetera Conectada</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 bg-slate-900/50 rounded text-xs text-muted-foreground break-all">
          {address}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          navigator.clipboard.writeText(address || "");
        }}>
          📋 Copiar Dirección
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ConnectButton.Custom>
          {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
            return (
              <DropdownMenuItem
                onClick={openConnectModal}
                className="text-red-400 hover:text-red-300"
              >
                🔌 Desconectar
              </DropdownMenuItem>
            );
          }}
        </ConnectButton.Custom>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
