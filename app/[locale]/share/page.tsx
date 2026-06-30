};

export default function ShareCardPage() {
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);
  const shareImageRef = useRef<HTMLDivElement>(null!);
  const { color } = useTheme();
  const { address: walletAddress, network } = useWrapStore();

}
