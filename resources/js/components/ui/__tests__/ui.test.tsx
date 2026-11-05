import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AlertSuccess from '@/components/ui/alert-success';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as AlertDialogM from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import * as Bc from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as D from '@/components/ui/dialog';
import * as DM from '@/components/ui/dropdown-menu';
import * as F from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as NM from '@/components/ui/navigation-menu';
import * as P from '@/components/ui/pagination';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import * as Pop from '@/components/ui/popover';
import * as S from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import * as Sh from '@/components/ui/sheet';
import * as Sb from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { StarDisplay } from '@/components/ui/star-display';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Home } from 'lucide-react';

describe('ui simples', () => {
    it('renderiza primitivos', async () => {
        const onClick = vi.fn();
        render(
            <TooltipProvider>
                <AlertSuccess message="Salvo!" />
                <Alert variant="destructive"><AlertTitle>T</AlertTitle><AlertDescription>D</AlertDescription></Alert>
                <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
                <Badge variant="secondary">B</Badge>
                <Button onClick={onClick} variant="outline" size="sm">Clique</Button>
                <Button asChild><a href="/x">Link</a></Button>
                <Card><CardHeader><CardTitle>CT</CardTitle><CardDescription>CD</CardDescription></CardHeader><CardContent>CC</CardContent><CardFooter>CF</CardFooter></Card>
                <Checkbox aria-label="chk" />
                <Collapsible><CollapsibleTrigger>abrir</CollapsibleTrigger><CollapsibleContent>conteúdo</CollapsibleContent></Collapsible>
                <Icon iconNode={Home} className="x" />
                <Input aria-label="in" />
                <Label>Lbl</Label>
                <PlaceholderPattern className="p" />
                <Separator />
                <Skeleton />
                <Spinner />
                <StarDisplay nota={3} />
                <Textarea aria-label="ta" />
                <Toggle aria-label="tg">T</Toggle>
                <ToggleGroup type="single"><ToggleGroupItem value="a">A</ToggleGroupItem><ToggleGroupItem value="b">B</ToggleGroupItem></ToggleGroup>
                <Tooltip><TooltipTrigger>tt</TooltipTrigger><TooltipContent>dica</TooltipContent></Tooltip>
            </TooltipProvider>,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('Clique'));
        expect(onClick).toHaveBeenCalled();
        await u.click(screen.getByLabelText('chk'));
        await u.click(screen.getByText('abrir'));
        expect(screen.getByText('conteúdo')).toBeInTheDocument();
        await u.click(screen.getByText('A'));
        await u.click(screen.getByLabelText('tg'));
        await u.type(screen.getByLabelText('in'), 'abc');
        expect(screen.getByLabelText('in')).toHaveValue('abc');
        expect(screen.getByText('Salvo!')).toBeInTheDocument();
    });

    it('breadcrumb, pagination, field, otp', () => {
        render(
            <>
                <Bc.Breadcrumb><Bc.BreadcrumbList><Bc.BreadcrumbItem><Bc.BreadcrumbLink href="/">Home</Bc.BreadcrumbLink></Bc.BreadcrumbItem><Bc.BreadcrumbSeparator /><Bc.BreadcrumbEllipsis /><Bc.BreadcrumbItem><Bc.BreadcrumbPage>Atual</Bc.BreadcrumbPage></Bc.BreadcrumbItem></Bc.BreadcrumbList></Bc.Breadcrumb>
                <P.Pagination><P.PaginationContent><P.PaginationItem><P.PaginationPrevious href="/1" /></P.PaginationItem><P.PaginationItem><P.PaginationLink href="/2" isActive>2</P.PaginationLink></P.PaginationItem><P.PaginationEllipsis /><P.PaginationItem><P.PaginationNext href="/3" /></P.PaginationItem></P.PaginationContent></P.Pagination>
                <F.FieldSet><F.FieldLegend>L</F.FieldLegend><F.FieldGroup><F.Field orientation="horizontal"><F.FieldContent><F.FieldLabel>Nome</F.FieldLabel><F.FieldTitle>Tt</F.FieldTitle><F.FieldDescription>desc</F.FieldDescription></F.FieldContent><F.FieldError>erro único</F.FieldError><F.FieldError errors={[{ message: 'a' }, { message: 'b' }]} /><F.FieldError errors={[{ message: 'solo' }]} /></F.Field><F.FieldSeparator>ou</F.FieldSeparator></F.FieldGroup></F.FieldSet>
                <InputOTP maxLength={6}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /></InputOTPGroup><InputOTPSeparator /></InputOTP>
            </>,
        );
        expect(screen.getByText('Atual')).toBeInTheDocument();
        expect(screen.getByText('solo')).toBeInTheDocument();
    });
});

describe('ui overlays', () => {
    it('dialog', async () => {
        render(
            <D.Dialog>
                <D.DialogTrigger>abrir</D.DialogTrigger>
                <D.DialogContent>
                    <D.DialogHeader><D.DialogTitle>Título</D.DialogTitle><D.DialogDescription>Desc</D.DialogDescription></D.DialogHeader>
                    <D.DialogFooter><D.DialogClose>fechar</D.DialogClose></D.DialogFooter>
                </D.DialogContent>
            </D.Dialog>,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('abrir'));
        expect(screen.getByText('Título')).toBeInTheDocument();
        await u.click(screen.getByText('fechar'));
    });
    it('alert dialog', async () => {
        const A = AlertDialogM;
        render(
            <A.AlertDialog>
                <A.AlertDialogTrigger>abrir</A.AlertDialogTrigger>
                <A.AlertDialogContent>
                    <A.AlertDialogHeader><A.AlertDialogTitle>Certeza?</A.AlertDialogTitle><A.AlertDialogDescription>d</A.AlertDialogDescription></A.AlertDialogHeader>
                    <A.AlertDialogFooter><A.AlertDialogCancel>Não</A.AlertDialogCancel><A.AlertDialogAction>Sim</A.AlertDialogAction></A.AlertDialogFooter>
                </A.AlertDialogContent>
            </A.AlertDialog>,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('abrir'));
        expect(screen.getByText('Certeza?')).toBeInTheDocument();
        await u.click(screen.getByText('Não'));
    });
    it('sheet', async () => {
        render(
            <Sh.Sheet>
                <Sh.SheetTrigger>abrir</Sh.SheetTrigger>
                <Sh.SheetContent side="left"><Sh.SheetHeader><Sh.SheetTitle>ST</Sh.SheetTitle><Sh.SheetDescription>SD</Sh.SheetDescription></Sh.SheetHeader><Sh.SheetFooter><Sh.SheetClose>x</Sh.SheetClose></Sh.SheetFooter></Sh.SheetContent>
            </Sh.Sheet>,
        );
        await userEvent.setup().click(screen.getByText('abrir'));
        expect(screen.getByText('ST')).toBeInTheDocument();
    });
    it('popover', async () => {
        render(<Pop.Popover><Pop.PopoverTrigger>abrir</Pop.PopoverTrigger><Pop.PopoverContent><Pop.PopoverHeader><Pop.PopoverTitle>PT</Pop.PopoverTitle><Pop.PopoverDescription>PD</Pop.PopoverDescription></Pop.PopoverHeader></Pop.PopoverContent></Pop.Popover>);
        await userEvent.setup().click(screen.getByText('abrir'));
        expect(screen.getByText('PT')).toBeInTheDocument();
    });
    it('dropdown menu', async () => {
        const onSel = vi.fn();
        render(
            <DM.DropdownMenu>
                <DM.DropdownMenuTrigger>menu</DM.DropdownMenuTrigger>
                <DM.DropdownMenuContent>
                    <DM.DropdownMenuLabel>Lbl</DM.DropdownMenuLabel>
                    <DM.DropdownMenuSeparator />
                    <DM.DropdownMenuGroup>
                        <DM.DropdownMenuItem onSelect={onSel} variant="destructive">Item<DM.DropdownMenuShortcut>⌘K</DM.DropdownMenuShortcut></DM.DropdownMenuItem>
                        <DM.DropdownMenuCheckboxItem checked>Chk</DM.DropdownMenuCheckboxItem>
                    </DM.DropdownMenuGroup>
                    <DM.DropdownMenuRadioGroup value="a"><DM.DropdownMenuRadioItem value="a">Ra</DM.DropdownMenuRadioItem></DM.DropdownMenuRadioGroup>
                    <DM.DropdownMenuSub><DM.DropdownMenuSubTrigger>Sub</DM.DropdownMenuSubTrigger><DM.DropdownMenuSubContent><DM.DropdownMenuItem>In</DM.DropdownMenuItem></DM.DropdownMenuSubContent></DM.DropdownMenuSub>
                </DM.DropdownMenuContent>
            </DM.DropdownMenu>,
        );
        const u = userEvent.setup();
        await u.click(screen.getByText('menu'));
        await u.click(await screen.findByText('Item'));
        expect(onSel).toHaveBeenCalled();
    });
    it('select', async () => {
        render(
            <S.Select defaultValue="a">
                <S.SelectTrigger size="sm"><S.SelectValue /></S.SelectTrigger>
                <S.SelectContent>
                    <S.SelectGroup><S.SelectLabel>G</S.SelectLabel><S.SelectItem value="a">Alfa</S.SelectItem><S.SelectSeparator /><S.SelectItem value="b">Beta</S.SelectItem></S.SelectGroup>
                </S.SelectContent>
            </S.Select>,
        );
        const u = userEvent.setup();
        await u.click(screen.getByRole('combobox'));
        expect(await screen.findAllByText('Beta')).not.toHaveLength(0);
    });
    it('navigation menu', () => {
        render(
            <NM.NavigationMenu>
                <NM.NavigationMenuList>
                    <NM.NavigationMenuItem><NM.NavigationMenuTrigger>Tr</NM.NavigationMenuTrigger><NM.NavigationMenuContent><NM.NavigationMenuLink href="/a">A</NM.NavigationMenuLink></NM.NavigationMenuContent></NM.NavigationMenuItem>
                    <NM.NavigationMenuItem><NM.NavigationMenuLink className={NM.navigationMenuTriggerStyle()} href="/b">B</NM.NavigationMenuLink></NM.NavigationMenuItem>
                </NM.NavigationMenuList>
            </NM.NavigationMenu>,
        );
        expect(screen.getByText('Tr')).toBeInTheDocument();
    });
});

describe('sidebar', () => {
    function Harness({ collapsible = 'offcanvas' as any, variant = 'sidebar' as any, side = 'left' as any }) {
        return (
            <TooltipProvider>
                <Sb.SidebarProvider>
                    <Sb.Sidebar collapsible={collapsible} variant={variant} side={side}>
                        <Sb.SidebarHeader>H</Sb.SidebarHeader>
                        <Sb.SidebarInput aria-label="busca" />
                        <Sb.SidebarContent>
                            <Sb.SidebarGroup>
                                <Sb.SidebarGroupLabel>Grupo</Sb.SidebarGroupLabel>
                                <Sb.SidebarGroupAction>+</Sb.SidebarGroupAction>
                                <Sb.SidebarGroupContent>
                                    <Sb.SidebarMenu>
                                        <Sb.SidebarMenuItem>
                                            <Sb.SidebarMenuButton isActive tooltip="Tip" variant="outline" size="lg">Botão</Sb.SidebarMenuButton>
                                            <Sb.SidebarMenuAction showOnHover>a</Sb.SidebarMenuAction>
                                            <Sb.SidebarMenuBadge>3</Sb.SidebarMenuBadge>
                                            <Sb.SidebarMenuSub><Sb.SidebarMenuSubItem><Sb.SidebarMenuSubButton href="#">sub</Sb.SidebarMenuSubButton></Sb.SidebarMenuSubItem></Sb.SidebarMenuSub>
                                        </Sb.SidebarMenuItem>
                                        <Sb.SidebarMenuItem><Sb.SidebarMenuSkeleton showIcon /></Sb.SidebarMenuItem>
                                    </Sb.SidebarMenu>
                                </Sb.SidebarGroupContent>
                            </Sb.SidebarGroup>
                            <Sb.SidebarSeparator />
                        </Sb.SidebarContent>
                        <Sb.SidebarFooter>F</Sb.SidebarFooter>
                        <Sb.SidebarRail />
                    </Sb.Sidebar>
                    <Sb.SidebarInset><Sb.SidebarTrigger /></Sb.SidebarInset>
                </Sb.SidebarProvider>
            </TooltipProvider>
        );
    }
    it('renderiza e alterna', async () => {
        render(<Harness />);
        const u = userEvent.setup();
        await u.click(document.querySelector('[data-slot="sidebar-trigger"]')!);
        await u.keyboard('{Control>}b{/Control}');
        expect(screen.getAllByText('Botão').length).toBeGreaterThan(0);
    });
    it('variantes', () => {
        render(<Harness collapsible="none" />);
        render(<Harness collapsible="icon" variant="floating" side="right" />);
        render(<Harness variant="inset" />);
    });
    it('useSidebar fora do provider lança', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const C = () => { Sb.useSidebar(); return null; };
        expect(() => render(<C />)).toThrow();
        spy.mockRestore();
    });
    it('mobile', async () => {
        const mm = window.matchMedia;
        (window as any).matchMedia = (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null });
        vi.resetModules();
        const { SidebarProvider, Sidebar, SidebarTrigger } = await import('@/components/ui/sidebar');
        render(<TooltipProvider><SidebarProvider><Sidebar><div>mob</div></Sidebar><SidebarTrigger /></SidebarProvider></TooltipProvider>);
        await userEvent.setup().click(document.querySelector('[data-slot="sidebar-trigger"]')!);
        window.matchMedia = mm;
        expect(within(document.body).getAllByText(/mob/).length).toBeGreaterThan(0);
    });
});
