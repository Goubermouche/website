# x64 assembly
{
## Useful links
- [Online x64 assembler](https://defuse.ca/online-x86-assembler.htm#disassembly2)   
- [AsmGrid](https://asmjit.com/asmgrid/)  
- [Encoding](https://wiki.osdev.org/X86-64_Instruction_Encoding)  
}

{
## GP registers
| X.reg      | 64b | 32b  | 16b  | 8b      |
| 0.000 (0)  | RAX | EAX  | AX   | AL      |
| 0.001 (1)  | RCX | ECX  | CX   | CL      |
| 0.010 (2)  | RDX | EDX  | DX   | DL      |
| 0.011 (3)  | RBX | EBX  | BX   | BL      |
| 0.100 (4)  | RSP | ESP  | SP   | AH, SPL |
| 0.101 (5)  | RBP | EBP  | BP   | CH, BPL |
| 0.110 (6)  | RSI | ESI  | SI   | DH, SIL |
| 0.111 (7)  | RDI | EDI  | DI   | BH, DIL |
| 1.000 (8)  | R8  | R8D  | R8W  | R8L     |
| 1.001 (9)  | R9  | R9D  | R9W  | R9L     |
| 1.010 (10) | R10 | R10D | R10W | R10L    |
| 1.011 (11) | R11 | R11D | R11W | R11L    |
| 1.100 (12) | R12 | R12D | R12W | R12L    |
| 1.101 (13) | R13 | R13D | R13W | R13L    |
| 1.110 (14) | R14 | R14D | R14W | R14L    |
| 1.111 (15) | R15 | R15D | R15W | R15L    |
}