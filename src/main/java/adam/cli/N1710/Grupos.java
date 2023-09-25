package adam.cli.N1710;

import adam.cli.Diretorio;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;

public class Grupos {

    public static List<String> listaSaidaCSV = new ArrayList<>();
    private File arquivoOrigem;
    private File pastaDestino;
    private String sistemaDestino = "";
    private boolean mostraSaida = Diretorio.mostraSaida;
    private String g0 = "";
    private String g1 = "";
    private String g2 = "";
    private String g3 = "";
    private String g4 = "";
    private String g5 = "";
    private String g6 = "";
    private String g7 = "";
    private String sigemA = "";
    private String sigemB = "";
    private String nomeOriginal = "";

    public Grupos(File arquivoOrigem, File diretorioDestino) {

        String csv = arquivoOrigem.getName() + ";";
        this.nomeOriginal = arquivoOrigem.getName();
        this.arquivoOrigem = arquivoOrigem;
        this.pastaDestino = diretorioDestino;

        String strPadrao1 = "([a-zA-Z])?[-]"
                + "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})[_]([a-zA-Z0-9]?)";

        String strPadrao2 = "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})[_]([a-zA-Z0-9]?)";

        String strPadrao3 = "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})";

        String strPadrao4 = "([a-zA-Z])?[-]"
                + "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})";

        Pattern padraoPresente1 = Pattern.compile(strPadrao1);
        Matcher matcherPadrao1 = padraoPresente1.matcher(arquivoOrigem.getName());

        Pattern padraoPresente2 = Pattern.compile(strPadrao2);
        Matcher matcherPadrao2 = padraoPresente2.matcher(arquivoOrigem.getName());

        Pattern padraoPresente3 = Pattern.compile(strPadrao3);
        Matcher matcherPadrao3 = padraoPresente3.matcher(arquivoOrigem.getName());

        Pattern padraoPresente4 = Pattern.compile(strPadrao4);
        Matcher matcherPadrao4 = padraoPresente4.matcher(arquivoOrigem.getName());

        if (matcherPadrao1.find()) {

            if (matcherPadrao1.group(1) != null) {
                this.g0 = matcherPadrao1.group(1);
            }

            if (matcherPadrao1.group(2) != null) {
                this.g1 = matcherPadrao1.group(2);
            }

            if (matcherPadrao1.group(3) != null) {
                this.g2 = matcherPadrao1.group(3);
            }

            if (matcherPadrao1.group(4) != null) {
                this.g3 = matcherPadrao1.group(4);
            }

            if (matcherPadrao1.group(5) != null) {
                this.g4 = matcherPadrao1.group(5);
            }

            if (matcherPadrao1.group(6) != null) {
                this.g5 = matcherPadrao1.group(6);
            }

            if (matcherPadrao1.group(7) != null) {
                this.g6 = matcherPadrao1.group(7);
            }

            if (matcherPadrao1.group(8) != null) {
                this.g7 = matcherPadrao1.group(8);
            }

            Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.[pdf|PDF]");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = matcherPadraoRevisao.group(2);
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao2.find()) {

            this.g0 = "X";

            if (matcherPadrao2.group(1) != null) {
                this.g1 = matcherPadrao2.group(1);
            }

            if (matcherPadrao2.group(2) != null) {
                this.g2 = matcherPadrao2.group(2);
            }

            if (matcherPadrao2.group(3) != null) {
                this.g3 = matcherPadrao2.group(3);
            }

            if (matcherPadrao2.group(4) != null) {
                this.g4 = matcherPadrao2.group(4);
            }

            if (matcherPadrao2.group(5) != null) {
                this.g5 = matcherPadrao2.group(5);
            }

            if (matcherPadrao2.group(6) != null) {
                this.g6 = matcherPadrao2.group(6);
            }

            if (matcherPadrao2.group(7) != null) {
                this.g7 = matcherPadrao2.group(7);
            }

            Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.[pdf|PDF]");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = matcherPadraoRevisao.group(2);
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao3.find()) {

            this.g0 = "X";

            if (matcherPadrao3.group(1) != null) {
                this.g1 = matcherPadrao3.group(1);
            }

            if (matcherPadrao3.group(2) != null) {
                this.g2 = matcherPadrao3.group(2);
            }

            if (matcherPadrao3.group(3) != null) {
                this.g3 = matcherPadrao3.group(3);
            }

            if (matcherPadrao3.group(4) != null) {
                this.g4 = matcherPadrao3.group(4);
            }

            if (matcherPadrao3.group(5) != null) {
                this.g5 = matcherPadrao3.group(5);
            }

            if (matcherPadrao3.group(6) != null) {
                this.g6 = matcherPadrao3.group(6);
            }

            this.g7 = "1";

            Pattern padraoRevisao = Pattern.compile("(.*)\\.[pdf|PDF]");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = "0";
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao4.find()) {

            this.g0 = matcherPadrao1.group(1);

            if (matcherPadrao4.group(2) != null) {
                this.g1 = matcherPadrao4.group(2);
            }

            if (matcherPadrao4.group(3) != null) {
                this.g2 = matcherPadrao4.group(3);
            }

            if (matcherPadrao4.group(4) != null) {
                this.g3 = matcherPadrao4.group(4);
            }

            if (matcherPadrao4.group(5) != null) {
                this.g4 = matcherPadrao4.group(5);
            }

            if (matcherPadrao4.group(6) != null) {
                this.g5 = matcherPadrao4.group(6);
            }

            if (matcherPadrao4.group(7) != null) {
                this.g6 = matcherPadrao4.group(7);
            }

            this.g7 = "1";

            Pattern padraoRevisao = Pattern.compile("(.*)\\.[pdf|PDF]");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = "0";
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }
        }

        if (g0.equals("")) {
            g0 = "?";
        }
        if (g1.equals("")) {
            g1 = "?";
        }
        if (g2.equals("")) {
            g2 = "?";
        }
        if (g3.equals("")) {
            g3 = "?";
        }
        if (g4.equals("")) {
            g4 = "?";
        }
        if (g5.equals("")) {
            g5 = "?";
        }
        if (g6.equals("")) {
            g6 = "?";
        }
        if (g7.equals("")) {
            g7 = "?";
        }

        csv += g0 + ";" + g1 + ";" + g2 + ";" + g3 + ";" + g4 + ";" + g5 + ";" + g6 + ";" + g7 + ";";

        if (sigemA.equals("")) {
            sigemA = "?";
        }

        if (sigemB.equals("")) {
            sigemB = "?";
        }

        sistemaDestino = this.procuraPastaDestino();

        if (sistemaDestino.equals("")) {
            sistemaDestino = "?";
        }

        csv += sigemA + ";" + sigemB + ";" + sistemaDestino + ";";

        String link = "";

        if (sistemaDestino.contains("NAO_CADASTRADO") || sistemaDestino.contains("?") || g1.equals("?")) {
            csv += ";;;;";
        } else {
            link = "=HIPERLINK(\"" + pastaDestino + "\\" + sistemaDestino + "\\" + g1 + "\")";
            csv += pastaDestino + "\\" + sistemaDestino + "\\" + g1 + ";" + link;
        }

        csv += "\r\n";

        if (mostraSaida) {
            System.out.println(nomeOriginal + "\nG0: " + g0 + "\nG1: " + g1 + "\nG2: " + g2 + "\nG3: " + g3 + "\nG4: " + g4 + "\nG5: " + g5 + "\nG6: " + g6 + "\nG7: " + g7
                    + "\nSIGEM_A: " + sigemA + "\nSIGEM_B:" + sigemB + "\nSISTEMA: " + sistemaDestino + "\nLINK: " + link);
        }

        listaSaidaCSV.add(csv);
    }

    private String procuraPastaDestino() {

        //O retorno do método é o nome do sistema. Este nome é obtido da pasta de destino, quando existir.    
        //G1 representa a categorai, composto por 2 letras    
        //G3 representa a área ou atividade, composto por 4 dígitos
        //f é o arquivo no diretório de destino
        //O loop é interrompido quando encontrado no destino a pasta com o sistema. Se o loop terminar sem encontrar o
        //sistema, pode ser que não haja a pasta ou a subpasta. Então o sistema tentará criar.
        for (File f : pastaDestino.listFiles()) {
            if (g1.length() == 2 && g3.length() == 4 && f.getName().startsWith(g3)) {
                File nf = new File(f.getAbsoluteFile() + "/" + g1);
                boolean copiar = this.testaVersao(arquivoOrigem, nf);
                if (copiar) {
                    this.copia(arquivoOrigem, nf);
                }
                return f.getName();
            }

        }
        //Tenta criar a pasta do sistema não encontrado no destino.
        if (g3.length() == 4) {
            File diretorioPai = new File(pastaDestino.getAbsoluteFile() + "/" + g3);
            diretorioPai.mkdir();
            //System.out.println("Novo diretório pai: " + diretorioPai.getAbsoluteFile());

            if (g1.length() == 2) {
                File diretorioFilho = new File(diretorioPai.getAbsoluteFile() + "/" + g1);
                //System.out.println("Novo diretório filho: " + diretorioFilho.getAbsoluteFile());
                diretorioFilho.mkdir();
                boolean copiar = this.testaVersao(arquivoOrigem, diretorioFilho.getAbsoluteFile());
                if (copiar) {
                    System.out.println(arquivoOrigem.getName() + " será copiado [1].");
                    this.copia(arquivoOrigem, diretorioFilho.getAbsoluteFile());
                }
            }
            return diretorioPai.getName();
        } else {
            ///System.out.println("****  Copiando " + arquivoOrigem.getName() + " para temporário: " + pastaDestino + "/TEMP");
            File temp = new File(pastaDestino.getAbsoluteFile() + "/TEMP");
            boolean copiar = this.testaVersao(arquivoOrigem, temp);
            if (copiar) {
                System.out.println(arquivoOrigem.getName() + " será copiado [2].");
                this.copia(arquivoOrigem, temp);
            }
        }
        return "NAO_CADASTRADO";
    }

    private boolean testaVersao(File arquivoOrigem, File diretorioDestino) {

        //Tenta listar todos arquivos similares
        try {
            for (File f : diretorioDestino.listFiles()) {

                String strPadrao = "((.*)_([a-zA-Z0]))\\.";
                Pattern padraoVersao = Pattern.compile(strPadrao);
                Matcher matcherVersaoListado = padraoVersao.matcher(f.getName());
                Matcher matcherVersaoAtual = padraoVersao.matcher(arquivoOrigem.getName());

                if (matcherVersaoAtual.find() && matcherVersaoListado.find()) {

                    if (matcherVersaoAtual.group(2).equals(matcherVersaoListado.group(2))) {

                        int comparacao = matcherVersaoAtual.group(3).compareToIgnoreCase(matcherVersaoListado.group(3));

                        if (comparacao == 0) {
                            //System.out.println("Mesma versão ");
                            return false;
                        } else if (comparacao < 0) {
                            System.out.print("< Origem: " + arquivoOrigem.getName());
                            System.out.println("\tMantém: " + f.getName());
                            return false;
                        } else if (comparacao > 0) {
                            System.out.print("> Origem: " + arquivoOrigem.getName());
                            System.out.println("\tDeleta: " + f.getName());
                            arquivoOrigem.deleteOnExit();
                            return true;
                        } else {
                            System.out.println("Não há outra versão " + arquivoOrigem.getName());
                            return true;
                        }
                    }
                }
            }
        } catch (Exception e) {
//            System.out.println("Erro " + e);
            return false;
        }

        return false;
    }

    private void copia(File arquivoOrigem, File diretorioDestino) {

        File arquivoFinal = new File(diretorioDestino + "/" + arquivoOrigem.getName());
        System.out.println("   ***   ");

        if (arquivoFinal.exists()) {
            ///System.out.println(arquivoFinal.getName() + " já existe.");
        } else {
            ///System.out.println(arquivoFinal.getName() + " será copiado.");
            try {
                FileUtils.copyToDirectory(arquivoOrigem, diretorioDestino);

            } catch (IOException ex) {
                Logger.getLogger(Grupos.class
                        .getName()).log(Level.SEVERE, ex.getMessage(), ex);
            }
        }
    }
}
